import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTrainingDto } from './dto/create-training.dto';
import { Training } from './entities/training.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';
import { ClamAVService } from '../../../clamav/clamav.service';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { encryptBuffer, decryptBuffer } from 'src/common/utils/helper.utils';

@Injectable()
export class TrainingService {
  private readonly logger = new Logger(TrainingService.name);
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(Training)
    private readonly trainingRepository: Repository<Training>,
    @InjectRepository(HumanResource)
    private readonly humanResourceRepository: Repository<HumanResource>,
    @InjectRepository(WarehouseDocument)
    private readonly warehouseDocumentRepository: Repository<WarehouseDocument>,
    private readonly clamAVService: ClamAVService,
  ) {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  private async uploadWarehouseDocument(
    file: any,
    userId: string,
    documentableType: string,
    documentableId: string,
    documentType: string
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `File type '${fileExtension}' is not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
      );
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB`,
      );
    }

    const isMandatory = this.clamAVService.getScanMandatory();
    if(isMandatory) {
      // Scan file with ClamAV before processing
      try {
        this.logger.log(`🔍 Scanning file with ClamAV: ${file.originalname}`);
        const scanResult = await this.clamAVService.scanBuffer(
          file.buffer,
          file.originalname,
        );
  
        if (scanResult.isInfected) {
          this.logger.warn(
            `🚨 Infected file detected: ${file.originalname}, Viruses: ${scanResult.viruses.join(', ')}`,
          );
          throw new BadRequestException(
            `File is infected with malware: ${scanResult.viruses.join(', ')}. Upload rejected.`,
          );
        }
  
        this.logger.log(`✅ File passed ClamAV scan: ${file.originalname}`);
      } catch (error) {
        if (error instanceof BadRequestException) {
          // Always reject infected files, regardless of CLAMAV_SCAN setting
          throw error;
        }
        
        // Handle ClamAV service failures (unavailable, timeout, etc.)
        
        if (isMandatory) {
          // CLAMAV_SCAN=true: Block upload if scan fails
          this.logger.error(
            `ClamAV scan failed for ${file.originalname}: ${error.message}`,
            error.stack,
          );
          throw new BadRequestException(
            `Virus scanning unavailable: ${error.message}. Upload blocked due to mandatory scanning.`,
          );
        } else {
          // CLAMAV_SCAN=false: Log warning but allow upload (bypass on failure)
          this.logger.warn(
            `ClamAV scan failed for ${file.originalname}: ${error.message}. Bypassing scan and allowing upload.`,
            error.stack,
          );
        }
      }
    }

    const sanitizedFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, sanitizedFilename);
    const documentPath = `/uploads/${sanitizedFilename}`;

    // Encrypt file before saving
    const { encrypted, iv, authTag } = encryptBuffer(file.buffer);

    // Save encrypted file to disk
    await fs.writeFile(filePath, encrypted);

    const mimeType = file.mimetype || 'application/octet-stream';

    const document = this.warehouseDocumentRepository.create({
      userId,
      documentableType,
      documentableId,
      documentType,
      originalFileName: file.originalname,
      filePath: documentPath,
      mimeType,
      iv,
      authTag,
      isActive: true,
    });

    return this.warehouseDocumentRepository.save(document);
  }

  private async deleteWarehouseDocument(documentId: string): Promise<void> {
    const document = await this.warehouseDocumentRepository.findOne({
      where: { id: documentId }
    });

    if (document) {
      try {
        const filePath = document.filePath.startsWith('/')
          ? path.join(process.cwd(), document.filePath.substring(1))
          : path.join(process.cwd(), document.filePath);
        
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Error deleting file ${document.filePath}:`, error);
      }

      await this.warehouseDocumentRepository.remove(document);
    }
  }

  async create(
    hrId: string,
    createTrainingDto: CreateTrainingDto,
    userId: string,
    certificateFile?: any
  ) {
    const humanResource = await this.humanResourceRepository.findOne({
      where: { id: hrId },
    });

    if (!humanResource) {
      throw new NotFoundException('HR entry not found');
    }

    const { trainingCertificate, ...trainingData } = createTrainingDto;

    // Convert null to undefined for dateOfCompletion to satisfy TypeORM's DeepPartial type
    const { dateOfCompletion, ...restTrainingData } = trainingData;
    const training = this.trainingRepository.create({
      humanResourceId: hrId,
      ...restTrainingData,
      dateOfCompletion: dateOfCompletion ?? undefined,
    });

    const savedTraining = await this.trainingRepository.save(training);

    if (certificateFile) {
      const documentResult = await this.uploadWarehouseDocument(
        certificateFile,
        userId,
        'Training',
        savedTraining.id,
        'trainingCertificate'
      );

      const certificateDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (certificateDocument) {
        savedTraining.trainingCertificate = certificateDocument;
        await this.trainingRepository.save(savedTraining);
      }
    }

    return savedTraining;
  }

  async update(
    trainingId: string,
    hrId: string,
    updateTrainingDto: CreateTrainingDto,
    userId: string,
    certificateFile?: any
  ) {
    const training = await this.trainingRepository.findOne({
      where: { id: trainingId, humanResourceId: hrId },
      relations: ['trainingCertificate'],
    });

    if (!training) {
      throw new NotFoundException('Training not found');
    }

    const { trainingCertificate, ...trainingData } = updateTrainingDto;

    Object.assign(training, trainingData);
    const savedTraining = await this.trainingRepository.save(training);

    if (certificateFile) {
      if (training.trainingCertificate) {
        await this.deleteWarehouseDocument(training.trainingCertificate.id);
      }

      const documentResult = await this.uploadWarehouseDocument(
        certificateFile,
        userId,
        'Training',
        savedTraining.id,
        'trainingCertificate'
      );

      const certificateDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (certificateDocument) {
        savedTraining.trainingCertificate = certificateDocument;
        await this.trainingRepository.save(savedTraining);
      }
    } else {
      if (trainingCertificate && typeof trainingCertificate === 'string') {
        const existingDocument = await this.warehouseDocumentRepository.findOne({
          where: { 
            id: trainingCertificate,
            documentableType: 'Training',
            documentableId: savedTraining.id,
            documentType: 'trainingCertificate'
          }
        });

        if (!existingDocument) {
          throw new BadRequestException('Invalid document ID provided or document does not belong to this training');
        }

        savedTraining.trainingCertificate = existingDocument;
        await this.trainingRepository.save(savedTraining);
      } else {
        savedTraining.trainingCertificate = training.trainingCertificate;
        await this.trainingRepository.save(savedTraining);
      }
    }

    return savedTraining;
  }

  async remove(trainingId: string, hrId: string) {
    const training = await this.trainingRepository.findOne({
      where: { id: trainingId, humanResourceId: hrId },
      relations: ['trainingCertificate'],
    });

    if (!training) {
      throw new NotFoundException('Training not found');
    }

    if (training.trainingCertificate) {
      await this.deleteWarehouseDocument(training.trainingCertificate.id);
    }

    await this.trainingRepository.remove(training);

    return { message: 'Training deleted successfully' };
  }

  findAll() {
    return `This action returns all training`;
  }

  findOne(id: number) {
    return `This action returns a #${id} training`;
  }

  async downloadWarehouseDocument(documentId: string) {
    const document = await this.warehouseDocumentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const filename = path.basename(document.filePath);
    const fullPath = path.join(this.uploadDir, filename);

    if (!fsSync.existsSync(fullPath)) {
      throw new NotFoundException('File not found on disk');
    }

    const encryptedBuffer = fsSync.readFileSync(fullPath);

    let decryptedBuffer: Buffer;
    if (document.iv && document.authTag) {
      try {
        decryptedBuffer = decryptBuffer(encryptedBuffer, document.iv, document.authTag);
      } catch (error: any) {
        throw new BadRequestException(`Failed to decrypt document: ${error.message}`);
      }
    } else {
      decryptedBuffer = encryptedBuffer;
    }

    return {
      buffer: decryptedBuffer,
      mimeType: document.mimeType || 'application/octet-stream',
      filename: document.originalFileName,
    };
  }
}
