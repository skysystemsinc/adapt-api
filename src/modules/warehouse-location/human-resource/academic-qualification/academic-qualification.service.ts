import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAcademicQualificationDto } from './dto/create-academic-qualification.dto';
import { AcademicQualification } from './entities/academic-qualification.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { encryptBuffer } from 'src/common/utils/helper.utils';

@Injectable()
export class AcademicQualificationService {
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(AcademicQualification)
    private readonly academicQualificationRepository: Repository<AcademicQualification>,
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
    createAcademicQualificationDto: CreateAcademicQualificationDto,
    userId: string,
    certificateFile?: any
  ) {
    const humanResource = await this.humanResourceRepository.findOne({
      where: { id: hrId },
    });

    if (!humanResource) {
      throw new NotFoundException('HR entry not found');
    }

    const { academicCertificate, ...qualificationData } = createAcademicQualificationDto;

    const qualification = this.academicQualificationRepository.create({
      humanResourceId: hrId,
      ...qualificationData,
    });

    const savedQualification = await this.academicQualificationRepository.save(qualification);

    // Upload and link certificate file if provided
    if (certificateFile) {
      const documentResult = await this.uploadWarehouseDocument(
        certificateFile,
        userId,
        'AcademicQualification',
        savedQualification.id,
        'academicCertificate'
      );

      const certificateDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (certificateDocument) {
        savedQualification.academicCertificate = certificateDocument;
        await this.academicQualificationRepository.save(savedQualification);
      }
    }

    return savedQualification;
  }

  async update(
    qualId: string,
    hrId: string,
    updateAcademicQualificationDto: CreateAcademicQualificationDto,
    userId: string,
    certificateFile?: any
  ) {
    const qualification = await this.academicQualificationRepository.findOne({
      where: { id: qualId, humanResourceId: hrId },
      relations: ['academicCertificate'],
    });

    if (!qualification) {
      throw new NotFoundException('Academic qualification not found');
    }

    const { academicCertificate, ...qualificationData } = updateAcademicQualificationDto;

    Object.assign(qualification, qualificationData);
    const savedQualification = await this.academicQualificationRepository.save(qualification);

    // Handle file upload/update
    if (certificateFile) {
      // New file provided - delete old file and upload new one
      if (qualification.academicCertificate) {
        await this.deleteWarehouseDocument(qualification.academicCertificate.id);
      }

      const documentResult = await this.uploadWarehouseDocument(
        certificateFile,
        userId,
        'AcademicQualification',
        savedQualification.id,
        'academicCertificate'
      );

      const certificateDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (certificateDocument) {
        savedQualification.academicCertificate = certificateDocument;
        await this.academicQualificationRepository.save(savedQualification);
      }
    } else {
      // No new file provided - handle string (document ID) in DTO or keep existing
      if (academicCertificate && typeof academicCertificate === 'string') {
        const existingDocument = await this.warehouseDocumentRepository.findOne({
          where: { 
            id: academicCertificate,
            documentableType: 'AcademicQualification',
            documentableId: savedQualification.id,
            documentType: 'academicCertificate'
          }
        });

        if (!existingDocument) {
          throw new BadRequestException('Invalid document ID provided or document does not belong to this qualification');
        }

        savedQualification.academicCertificate = existingDocument;
        await this.academicQualificationRepository.save(savedQualification);
      } else {
        // Keep existing certificate
        savedQualification.academicCertificate = qualification.academicCertificate;
        await this.academicQualificationRepository.save(savedQualification);
      }
    }

    return savedQualification;
  }

  async remove(qualId: string, hrId: string) {
    const qualification = await this.academicQualificationRepository.findOne({
      where: { id: qualId, humanResourceId: hrId },
      relations: ['academicCertificate'],
    });

    if (!qualification) {
      throw new NotFoundException('Academic qualification not found');
    }

    // Delete associated file
    if (qualification.academicCertificate) {
      await this.deleteWarehouseDocument(qualification.academicCertificate.id);
    }

    await this.academicQualificationRepository.remove(qualification);

    return { message: 'Academic qualification deleted successfully' };
  }

  findAll() {
    return `This action returns all academicQualification`;
  }

  findOne(id: number) {
    return `This action returns a #${id} academicQualification`;
  }
}
