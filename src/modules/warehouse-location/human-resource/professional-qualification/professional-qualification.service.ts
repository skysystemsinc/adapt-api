import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProfessionalQualificationDto } from './dto/create-professional-qualification.dto';
import { ProfessionalQualification } from './entities/professional-qualification.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { encryptBuffer } from 'src/common/utils/helper.utils';

@Injectable()
export class ProfessionalQualificationService {
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(ProfessionalQualification)
    private readonly professionalQualificationRepository: Repository<ProfessionalQualification>,
    @InjectRepository(HumanResource)
    private readonly humanResourceRepository: Repository<HumanResource>,
    @InjectRepository(WarehouseDocument)
    private readonly warehouseDocumentRepository: Repository<WarehouseDocument>,
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
    createProfessionalQualificationDto: CreateProfessionalQualificationDto,
    userId: string,
    certificateFile?: any
  ) {
    const humanResource = await this.humanResourceRepository.findOne({
      where: { id: hrId },
    });

    if (!humanResource) {
      throw new NotFoundException('HR entry not found');
    }

    const { professionalCertificate, ...qualificationData } = createProfessionalQualificationDto;

    // Convert null to undefined for dateOfAward to satisfy TypeORM's DeepPartial type
    const { dateOfAward, ...restQualificationData } = qualificationData;
    const qualification = this.professionalQualificationRepository.create({
      humanResourceId: hrId,
      ...restQualificationData,
      dateOfAward: dateOfAward ?? undefined,
    });

    const savedQualification = await this.professionalQualificationRepository.save(qualification);

    if (certificateFile) {
      const documentResult = await this.uploadWarehouseDocument(
        certificateFile,
        userId,
        'ProfessionalQualification',
        savedQualification.id,
        'professionalCertificate'
      );

      const certificateDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (certificateDocument) {
        savedQualification.professionalCertificate = certificateDocument;
        await this.professionalQualificationRepository.save(savedQualification);
      }
    }

    return savedQualification;
  }

  async update(
    qualId: string,
    hrId: string,
    updateProfessionalQualificationDto: CreateProfessionalQualificationDto,
    userId: string,
    certificateFile?: any
  ) {
    const qualification = await this.professionalQualificationRepository.findOne({
      where: { id: qualId, humanResourceId: hrId },
      relations: ['professionalCertificate'],
    });

    if (!qualification) {
      throw new NotFoundException('Professional qualification not found');
    }

    const { professionalCertificate, ...qualificationData } = updateProfessionalQualificationDto;

    Object.assign(qualification, qualificationData);
    const savedQualification = await this.professionalQualificationRepository.save(qualification);

    if (certificateFile) {
      if (qualification.professionalCertificate) {
        await this.deleteWarehouseDocument(qualification.professionalCertificate.id);
      }

      const documentResult = await this.uploadWarehouseDocument(
        certificateFile,
        userId,
        'ProfessionalQualification',
        savedQualification.id,
        'professionalCertificate'
      );

      const certificateDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (certificateDocument) {
        savedQualification.professionalCertificate = certificateDocument;
        await this.professionalQualificationRepository.save(savedQualification);
      }
    } else {
      if (professionalCertificate && typeof professionalCertificate === 'string') {
        const existingDocument = await this.warehouseDocumentRepository.findOne({
          where: { 
            id: professionalCertificate,
            documentableType: 'ProfessionalQualification',
            documentableId: savedQualification.id,
            documentType: 'professionalCertificate'
          }
        });

        if (!existingDocument) {
          throw new BadRequestException('Invalid document ID provided or document does not belong to this qualification');
        }

        savedQualification.professionalCertificate = existingDocument;
        await this.professionalQualificationRepository.save(savedQualification);
      } else {
        savedQualification.professionalCertificate = qualification.professionalCertificate;
        await this.professionalQualificationRepository.save(savedQualification);
      }
    }

    return savedQualification;
  }

  async remove(qualId: string, hrId: string) {
    const qualification = await this.professionalQualificationRepository.findOne({
      where: { id: qualId, humanResourceId: hrId },
      relations: ['professionalCertificate'],
    });

    if (!qualification) {
      throw new NotFoundException('Professional qualification not found');
    }

    if (qualification.professionalCertificate) {
      await this.deleteWarehouseDocument(qualification.professionalCertificate.id);
    }

    await this.professionalQualificationRepository.remove(qualification);

    return { message: 'Professional qualification deleted successfully' };
  }

  findAll() {
    return `This action returns all professionalQualification`;
  }

  findOne(id: number) {
    return `This action returns a #${id} professionalQualification`;
  }
}
