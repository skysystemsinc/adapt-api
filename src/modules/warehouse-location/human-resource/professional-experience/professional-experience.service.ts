import { Injectable, Logger, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CreateProfessionalExperienceDto } from './dto/create-professional-experience.dto';
import { ProfessionalExperience } from './entities/professional-experience.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';
import { ClamAVService } from '../../../clamav/clamav.service';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { encryptBuffer, decryptBuffer } from 'src/common/utils/helper.utils';
import { WarehouseLocationService } from '../../warehouse-location.service';
import { WarehouseLocation, WarehouseLocationStatus } from '../../entities/warehouse-location.entity';
import { Assignment, AssignmentLevel } from '../../../warehouse/operator/assignment/entities/assignment.entity';
import { AssignmentSection } from '../../../warehouse/operator/assignment/entities/assignment-section.entity';
import { AssignmentStatus } from '../../../warehouse/operator/assignment/entities/assignment.entity';
import { ProfessionalExperienceHistory } from './entities/professional-experience-history.entity';

@Injectable()
export class ProfessionalExperienceService {
  private readonly logger = new Logger(ProfessionalExperienceService.name);
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(ProfessionalExperience)
    private readonly professionalExperienceRepository: Repository<ProfessionalExperience>,
    @InjectRepository(HumanResource)
    private readonly humanResourceRepository: Repository<HumanResource>,
    @InjectRepository(WarehouseDocument)
    private readonly warehouseDocumentRepository: Repository<WarehouseDocument>,
    private readonly clamAVService: ClamAVService,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(AssignmentSection)
    private readonly assignmentSectionRepository: Repository<AssignmentSection>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => WarehouseLocationService))
    private readonly warehouseLocationService: WarehouseLocationService,
    @InjectRepository(ProfessionalExperienceHistory)
    private readonly professionalExperienceHistoryRepository: Repository<ProfessionalExperienceHistory>,
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

  private convertBase64ToFile(
    base64String: string,
    fileName: string,
    mimeType?: string
  ): any {
    // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
    let base64Data = base64String;
    if (base64String.includes(',')) {
      base64Data = base64String.split(',')[1];
    }

    // Decode base64 to buffer
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      throw new BadRequestException('Invalid base64 file data');
    }

    // Validate file size (10MB max)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (buffer.length > maxSizeBytes) {
      throw new BadRequestException(
        `File size ${(buffer.length / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB`
      );
    }

    // Create file-like object that matches Multer file structure
    return {
      buffer,
      originalname: fileName,
      size: buffer.length,
      mimetype: mimeType || 'application/octet-stream',
    };
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
    userId: string
  ) {
    const humanResource = await this.humanResourceRepository.findOne({
      where: { id: hrId },
    });

    if (!humanResource) {
      throw new NotFoundException('HR entry not found');
    }

    const { experienceLetter, experienceLetterFileName, experienceLetterMimeType, ...experienceData } = createProfessionalExperienceDto;

    // Validate that date of appointment is not after date of leaving
    if (experienceData.dateOfAppointment && experienceData.dateOfLeaving) {
      const appointmentDate = new Date(experienceData.dateOfAppointment);
      const leavingDate = new Date(experienceData.dateOfLeaving);
      if (appointmentDate > leavingDate) {
        throw new BadRequestException('Date of Appointment must be before or equal to Date of Leaving');
      }
    }

    // Process base64 experience letter file if provided
    let experienceLetterFile: any = null;
    let isDocumentId = false;
    
    if (experienceLetter) {
      // Check if it's base64 (starts with "data:" or is a very long string without dashes)
      const isBase64 = experienceLetter.startsWith('data:') || 
                      (!experienceLetter.includes('-') && experienceLetter.length > 50);
      
      if (isBase64) {
        if (!experienceLetterFileName) {
          throw new BadRequestException('experienceLetterFileName is required when experienceLetter is base64');
        }
        experienceLetterFile = this.convertBase64ToFile(
          experienceLetter,
          experienceLetterFileName,
          experienceLetterMimeType
        );
      } else {
        isDocumentId = true;
      }
    }

    // Validate that experience letter is required when date of leaving is provided
    if (experienceData.dateOfLeaving && !experienceLetterFile && !isDocumentId) {
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
    } else if (isDocumentId && experienceLetter) {
      // Link existing document
      const existingDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: experienceLetter }
      });

      if (!existingDocument) {
        throw new BadRequestException('Invalid document ID provided');
      }

      // Update document to link to this experience
      existingDocument.documentableType = 'ProfessionalExperience';
      existingDocument.documentableId = savedExperience.id;
      existingDocument.documentType = 'experienceLetter';
      await this.warehouseDocumentRepository.save(existingDocument);

      savedExperience.experienceLetter = existingDocument;
      await this.professionalExperienceRepository.save(savedExperience);
    }

    return savedExperience;
  }

  async update(
    expId: string,
    hrId: string,
    updateProfessionalExperienceDto: CreateProfessionalExperienceDto,
    userId: string
  ) {
    const experience = await this.professionalExperienceRepository.findOne({
      where: { id: expId, humanResourceId: hrId },
      relations: ['experienceLetter', 'humanResource'],
    });
  
    if (!experience) {
      throw new NotFoundException('Professional experience not found');
    }
  
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: experience.humanResource.warehouseLocationId },
    });
  
    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location not found');
    }
  
    if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED, WarehouseLocationStatus.RESUBMITTED].includes(warehouseLocation.status)) {
      throw new BadRequestException('Professional experience can only be updated while application is in draft, rejected, or resubmitted status');
    }
  
    const { experienceLetter, experienceLetterFileName, experienceLetterMimeType, duration, ...experienceData } = updateProfessionalExperienceDto;
    
    // Process base64 experience letter file if provided
    let experienceLetterFile: any = null;
    let isDocumentId = false;
    
    if (experienceLetter) {
      // Check if it's base64 (starts with "data:" or is a very long string without dashes)
      const isBase64 = experienceLetter.startsWith('data:') || 
                      (!experienceLetter.includes('-') && experienceLetter.length > 50);
      
      if (isBase64) {
        if (!experienceLetterFileName) {
          throw new BadRequestException('experienceLetterFileName is required when experienceLetter is base64');
        }
        experienceLetterFile = this.convertBase64ToFile(
          experienceLetter,
          experienceLetterFileName,
          experienceLetterMimeType
        );
      } else {
        isDocumentId = true;
      }
    }
  
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
    const hasExperienceLetter = experienceLetterFile || isDocumentId || experience.experienceLetter;
    if (finalLeavingDateForValidation && !hasExperienceLetter) {
      throw new BadRequestException('Experience Letter is required when Date of Leaving is provided');
    }
  
    // Auto-calculate duration if not provided
    const calculatedDuration = duration || this.calculateDuration(
      finalAppointmentDate ?? null,
      finalLeavingDate ?? null
    );
  
    const result = await this.dataSource.transaction(async (manager) => {
      const expRepo = manager.getRepository(ProfessionalExperience);
      const expHistoryRepo = manager.getRepository(ProfessionalExperienceHistory);
  
      if (warehouseLocation.status === WarehouseLocationStatus.REJECTED) {
        const historyRecord = expHistoryRepo.create({
          professionalExperienceId: experience.id,
          humanResourceId: experience.humanResourceId,
          positionHeld: experience.positionHeld,
          organizationName: experience.organizationName,
          organizationAddress: experience.organizationAddress,
          natureOfOrganization: experience.natureOfOrganization,
          dateOfAppointment: experience.dateOfAppointment ?? null,
          dateOfLeaving: experience.dateOfLeaving ?? null,
          duration: experience.duration,
          responsibilities: experience.responsibilities ?? null,
          experienceLetter: experience.experienceLetter ?? null,
          isActive: false,
        } as Partial<ProfessionalExperienceHistory>);
        historyRecord.createdAt = experience.createdAt;
        await expHistoryRepo.save(historyRecord);
      }
  
      Object.assign(experience, {
        ...experienceData,
        duration: calculatedDuration,
      });
      return expRepo.save(experience);
    });
  
    // Handle file upload/update (outside transaction)
    if (experienceLetterFile) {
      // New base64 file - delete old one if exists
      if (experience.experienceLetter) {
        await this.deleteWarehouseDocument(experience.experienceLetter.id);
      }

      const documentResult = await this.uploadWarehouseDocument(
        experienceLetterFile,
        userId,
        'ProfessionalExperience',
        result.id,
        'experienceLetter'
      );

      const letterDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (letterDocument) {
        result.experienceLetter = letterDocument;
        await this.professionalExperienceRepository.save(result);
      }
    } else if (isDocumentId && experienceLetter) {
      // Existing document ID - verify and link
      const existingDocument = await this.warehouseDocumentRepository.findOne({
        where: { 
          id: experienceLetter,
          documentableType: 'ProfessionalExperience',
          documentableId: result.id,
          documentType: 'experienceLetter'
        }
      });

      if (!existingDocument) {
        throw new BadRequestException('Invalid document ID provided or document does not belong to this experience');
      }

      result.experienceLetter = existingDocument;
      await this.professionalExperienceRepository.save(result);
    } else {
      // No letter provided - keep existing
      result.experienceLetter = experience.experienceLetter;
      await this.professionalExperienceRepository.save(result);
    }
  
    // Track resubmission if application was REJECTED
    const updatedApplication = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocation.id },
    });
  
    if (updatedApplication?.status === WarehouseLocationStatus.REJECTED) {
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationLocationId: warehouseLocation.id,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });
  
      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '7-human-resources',
            resourceId: experience.id,
          },
        });
  
        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }
  
      await this.warehouseLocationService.trackWarehouseLocationResubmissionAndUpdateStatus(
        warehouseLocation.id,
        '7-human-resources',
        experience.id,
        assignmentSectionId ?? undefined,
      );
    }
  
    return result;
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
