import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWeighingDto } from './dto/create-weighing.dto';
import { UpdateWeighingDto } from './dto/update-weighing.dto';
import { Weighing } from './entities/weighing.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';
import { WarehouseDocument } from '../../warehouse/entities/warehouse-document.entity';
import { ClamAVService } from '../../clamav/clamav.service';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { encryptBuffer, decryptBuffer } from 'src/common/utils/helper.utils';

@Injectable()
export class WeighingsService {
  private readonly logger = new Logger(WeighingsService.name);
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(Weighing)
    private readonly weighingRepository: Repository<Weighing>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
    @InjectRepository(WarehouseDocument)
    private readonly warehouseDocumentRepository: Repository<WarehouseDocument>,
    private readonly clamAVService: ClamAVService,
  ) {
    // Ensure upload directory exists
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

    // Validate file type
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `File type '${fileExtension}' is not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
      );
    }

    // Validate file size (max 10MB)
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

    // Generate unique filename
    const sanitizedFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, sanitizedFilename);
    const documentPath = `/uploads/${sanitizedFilename}`;

    // Encrypt file before saving
    const { encrypted, iv, authTag } = encryptBuffer(file.buffer);

    // Save encrypted file to disk
    await fs.writeFile(filePath, encrypted);

    // Detect MIME type
    const mimeType = file.mimetype || 'application/octet-stream';

    // Create document record
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

  /**
   * Delete warehouse document (file from disk and database record)
   */
  private async deleteWarehouseDocument(documentId: string): Promise<void> {
    const document = await this.warehouseDocumentRepository.findOne({
      where: { id: documentId }
    });

    if (document) {
      // Delete file from disk
      try {
        // Remove leading slash if present and construct full path
        const filePath = document.filePath.startsWith('/')
          ? path.join(process.cwd(), document.filePath.substring(1))
          : path.join(process.cwd(), document.filePath);
        
        await fs.unlink(filePath);
      } catch (error) {
        // File might not exist, log but don't fail
        console.error(`Error deleting file ${document.filePath}:`, error);
      }

      // Delete document record from database
      await this.warehouseDocumentRepository.remove(document);
    }
  }

  /**
   * Get weighing by warehouse location ID
   */
  async findByWarehouseLocationId(warehouseLocationId: string, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    const weighing = await this.weighingRepository.findOne({
      where: { warehouseLocationId },
      relations: ['weighbridgeCalibrationCertificate'],
    });

    return weighing;
  }

  /**
   * Create or update weighing by warehouse location ID
   */
  async create(
    warehouseLocationId: string,
    createWeighingDto: CreateWeighingDto,
    userId: string,
    weighbridgeCalibrationCertificateFile: any
  ) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Weighing can only be added while application is in draft status');
    }

    // Validate that file is provided
    if (!weighbridgeCalibrationCertificateFile) {
      throw new BadRequestException('Weighbridge calibration certificate file is required');
    }

    const existingWeighing = await this.weighingRepository.findOne({
      where: { warehouseLocationId },
      relations: ['weighbridgeCalibrationCertificate'],
    });

    // Remove file field from DTO before saving
    const { weighbridgeCalibrationCertificate, ...weighingData } = createWeighingDto;

    if (existingWeighing) {
      Object.assign(existingWeighing, weighingData);
      const savedWeighing = await this.weighingRepository.save(existingWeighing);

      // Delete old file if it exists
      if (existingWeighing.weighbridgeCalibrationCertificate) {
        await this.deleteWarehouseDocument(existingWeighing.weighbridgeCalibrationCertificate.id);
      }

      // Upload and link the certificate file
      const documentResult = await this.uploadWarehouseDocument(
        weighbridgeCalibrationCertificateFile,
        userId,
        'Weighing',
        savedWeighing.id,
        'weighbridgeCalibrationCertificate'
      );

      const certificateDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (certificateDocument) {
        savedWeighing.weighbridgeCalibrationCertificate = certificateDocument;
        await this.weighingRepository.save(savedWeighing);
      }

      return savedWeighing;
    }

    const weighing = this.weighingRepository.create({
      warehouseLocationId,
      ...weighingData,
    });

    const savedWeighing = await this.weighingRepository.save(weighing);

    // Upload and link the certificate file
    const documentResult = await this.uploadWarehouseDocument(
      weighbridgeCalibrationCertificateFile,
      userId,
      'Weighing',
      savedWeighing.id,
      'weighbridgeCalibrationCertificate'
    );

    const certificateDocument = await this.warehouseDocumentRepository.findOne({
      where: { id: documentResult.id }
    });

    if (certificateDocument) {
      savedWeighing.weighbridgeCalibrationCertificate = certificateDocument;
      await this.weighingRepository.save(savedWeighing);
    }

    await this.warehouseLocationRepository.update(warehouseLocationId, {
      weighing: savedWeighing,
    });

    return savedWeighing;
  }

  /**
   * Update weighing by warehouse location ID
   */
  async updateByWarehouseLocationId(
    warehouseLocationId: string,
    updateWeighingDto: CreateWeighingDto,
    userId: string,
    weighbridgeCalibrationCertificateFile?: any
  ) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Weighing can only be updated while application is in draft status');
    }

    const weighing = await this.weighingRepository.findOne({
      where: { warehouseLocationId },
      relations: ['weighbridgeCalibrationCertificate'],
    });

    if (!weighing) {
      throw new NotFoundException('Weighing not found for this application');
    }

    // Remove file field from DTO before saving
    const { weighbridgeCalibrationCertificate, ...weighingData } = updateWeighingDto;

    Object.assign(weighing, weighingData);
    const savedWeighing = await this.weighingRepository.save(weighing);

    // Handle file upload/update
    if (weighbridgeCalibrationCertificateFile) {
      // New file provided - delete old file and upload new one
      if (weighing.weighbridgeCalibrationCertificate) {
        await this.deleteWarehouseDocument(weighing.weighbridgeCalibrationCertificate.id);
      }

      const documentResult = await this.uploadWarehouseDocument(
        weighbridgeCalibrationCertificateFile,
        userId,
        'Weighing',
        savedWeighing.id,
        'weighbridgeCalibrationCertificate'
      );

      const certificateDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (certificateDocument) {
        savedWeighing.weighbridgeCalibrationCertificate = certificateDocument;
        await this.weighingRepository.save(savedWeighing);
      }
    } else {
      // No new file provided - handle string (document ID) in DTO or keep existing
      if (weighbridgeCalibrationCertificate && typeof weighbridgeCalibrationCertificate === 'string') {
        // User sent document ID as string - validate it exists and belongs to this weighing
        const existingDocument = await this.warehouseDocumentRepository.findOne({
          where: { 
            id: weighbridgeCalibrationCertificate,
            documentableType: 'Weighing',
            documentableId: savedWeighing.id,
            documentType: 'weighbridgeCalibrationCertificate'
          }
        });

        if (!existingDocument) {
          throw new BadRequestException('Invalid document ID provided or document does not belong to this weighing');
        }

        // Keep the existing document
        savedWeighing.weighbridgeCalibrationCertificate = existingDocument;
        await this.weighingRepository.save(savedWeighing);
      } else {
        // No file and no document ID in DTO - ensure existing certificate is preserved
        if (!weighing.weighbridgeCalibrationCertificate) {
          throw new BadRequestException('Weighbridge calibration certificate is required');
        }
        // Keep existing certificate
        savedWeighing.weighbridgeCalibrationCertificate = weighing.weighbridgeCalibrationCertificate;
        await this.weighingRepository.save(savedWeighing);
      }
    }

    return savedWeighing;
  }

  findAll() {
    return `This action returns all weighings`;
  }

  findOne(id: number) {
    return `This action returns a #${id} weighing`;
  }

  update(id: number, updateWeighingDto: UpdateWeighingDto) {
    return `This action updates a #${id} weighing`;
  }

  remove(id: number) {
    return `This action removes a #${id} weighing`;
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
