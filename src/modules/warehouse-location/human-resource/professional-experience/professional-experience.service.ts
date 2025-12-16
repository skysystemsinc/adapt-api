import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProfessionalExperienceDto } from './dto/create-professional-experience.dto';
import { ProfessionalExperience } from './entities/professional-experience.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { encryptBuffer, decryptBuffer } from 'src/common/utils/helper.utils';

@Injectable()
export class ProfessionalExperienceService {
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(ProfessionalExperience)
    private readonly professionalExperienceRepository: Repository<ProfessionalExperience>,
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

  /**
   * Calculate duration in "X years Y months Z days" format from appointment and leaving dates
   */
  private calculateDuration(dateOfAppointment: Date | null, dateOfLeaving: Date | null): string {
    if (!dateOfAppointment) {
      return '';
    }

    const startDate = dayjs(dateOfAppointment);
    const endDate = dateOfLeaving ? dayjs(dateOfLeaving) : dayjs(); // Use current date if leaving date is not provided

    if (endDate.isBefore(startDate)) {
      return '';
    }

    const years = endDate.diff(startDate, 'year');
    const months = endDate.diff(startDate.add(years, 'year'), 'month');
    const days = endDate.diff(startDate.add(years, 'year').add(months, 'month'), 'day');

    const parts: string[] = [];
    if (years > 0) {
      parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    }
    if (months > 0) {
      parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    }
    if (days > 0) {
      parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    }

    return parts.length > 0 ? parts.join(' ') : '0 days';
  }

  async create(
    hrId: string,
    createProfessionalExperienceDto: CreateProfessionalExperienceDto,
    userId: string,
    experienceLetterFile?: any
  ) {
    const humanResource = await this.humanResourceRepository.findOne({
      where: { id: hrId },
    });

    if (!humanResource) {
      throw new NotFoundException('HR entry not found');
    }

    const { experienceLetter, ...experienceData } = createProfessionalExperienceDto;

    // Validate that date of appointment is not after date of leaving
    if (experienceData.dateOfAppointment && experienceData.dateOfLeaving) {
      const appointmentDate = new Date(experienceData.dateOfAppointment);
      const leavingDate = new Date(experienceData.dateOfLeaving);
      if (appointmentDate > leavingDate) {
        throw new BadRequestException('Date of Appointment must be before or equal to Date of Leaving');
      }
    }

    // Validate that experience letter is required when date of leaving is provided
    if (experienceData.dateOfLeaving && !experienceLetterFile && !experienceLetter) {
      throw new BadRequestException('Experience Letter is required when Date of Leaving is provided');
    }

    // Convert null to undefined for date fields to satisfy TypeORM's DeepPartial type
    const { dateOfAppointment, dateOfLeaving, duration, ...restExperienceData } = experienceData;
    
    // Auto-calculate duration if not provided
    const calculatedDuration = duration || this.calculateDuration(
      dateOfAppointment ?? null,
      dateOfLeaving ?? null
    );

    const experience = this.professionalExperienceRepository.create({
      humanResourceId: hrId,
      ...restExperienceData,
      dateOfAppointment: dateOfAppointment ?? undefined,
      dateOfLeaving: dateOfLeaving ?? undefined,
      duration: calculatedDuration,
    });

    const savedExperience = await this.professionalExperienceRepository.save(experience);

    if (experienceLetterFile) {
      const documentResult = await this.uploadWarehouseDocument(
        experienceLetterFile,
        userId,
        'ProfessionalExperience',
        savedExperience.id,
        'experienceLetter'
      );

      const letterDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (letterDocument) {
        savedExperience.experienceLetter = letterDocument;
        await this.professionalExperienceRepository.save(savedExperience);
      }
    }

    return savedExperience;
  }

  async update(
    expId: string,
    hrId: string,
    updateProfessionalExperienceDto: CreateProfessionalExperienceDto,
    userId: string,
    experienceLetterFile?: any
  ) {
    const experience = await this.professionalExperienceRepository.findOne({
      where: { id: expId, humanResourceId: hrId },
      relations: ['experienceLetter'],
    });

    if (!experience) {
      throw new NotFoundException('Professional experience not found');
    }

    const { experienceLetter, duration, ...experienceData } = updateProfessionalExperienceDto;

    // Validate that date of appointment is not after date of leaving
    const finalAppointmentDate = experienceData.dateOfAppointment ?? experience.dateOfAppointment;
    const finalLeavingDate = experienceData.dateOfLeaving ?? experience.dateOfLeaving;
    if (finalAppointmentDate && finalLeavingDate) {
      const appointmentDate = new Date(finalAppointmentDate);
      const leavingDate = new Date(finalLeavingDate);
      if (appointmentDate > leavingDate) {
        throw new BadRequestException('Date of Appointment must be before or equal to Date of Leaving');
      }
    }

    // Validate that experience letter is required when date of leaving is provided
    const finalLeavingDateForValidation = experienceData.dateOfLeaving ?? experience.dateOfLeaving;
    const hasExperienceLetter = experienceLetterFile || experienceLetter || experience.experienceLetter;
    if (finalLeavingDateForValidation && !hasExperienceLetter) {
      throw new BadRequestException('Experience Letter is required when Date of Leaving is provided');
    }

    // Auto-calculate duration if not provided
    const calculatedDuration = duration || this.calculateDuration(
      finalAppointmentDate ?? null,
      finalLeavingDate ?? null
    );

    Object.assign(experience, {
      ...experienceData,
      duration: calculatedDuration,
    });
    const savedExperience = await this.professionalExperienceRepository.save(experience);

    if (experienceLetterFile) {
      if (experience.experienceLetter) {
        await this.deleteWarehouseDocument(experience.experienceLetter.id);
      }

      const documentResult = await this.uploadWarehouseDocument(
        experienceLetterFile,
        userId,
        'ProfessionalExperience',
        savedExperience.id,
        'experienceLetter'
      );

      const letterDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (letterDocument) {
        savedExperience.experienceLetter = letterDocument;
        await this.professionalExperienceRepository.save(savedExperience);
      }
    } else {
      if (experienceLetter && typeof experienceLetter === 'string') {
        const existingDocument = await this.warehouseDocumentRepository.findOne({
          where: { 
            id: experienceLetter,
            documentableType: 'ProfessionalExperience',
            documentableId: savedExperience.id,
            documentType: 'experienceLetter'
          }
        });

        if (!existingDocument) {
          throw new BadRequestException('Invalid document ID provided or document does not belong to this experience');
        }

        savedExperience.experienceLetter = existingDocument;
        await this.professionalExperienceRepository.save(savedExperience);
      } else {
        savedExperience.experienceLetter = experience.experienceLetter;
        await this.professionalExperienceRepository.save(savedExperience);
      }
    }

    return savedExperience;
  }

  async remove(expId: string, hrId: string) {
    const experience = await this.professionalExperienceRepository.findOne({
      where: { id: expId, humanResourceId: hrId },
      relations: ['experienceLetter'],
    });

    if (!experience) {
      throw new NotFoundException('Professional experience not found');
    }

    if (experience.experienceLetter) {
      await this.deleteWarehouseDocument(experience.experienceLetter.id);
    }

    await this.professionalExperienceRepository.remove(experience);

    return { message: 'Professional experience deleted successfully' };
  }

  findAll() {
    return `This action returns all professionalExperience`;
  }

  findOne(id: number) {
    return `This action returns a #${id} professionalExperience`;
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
