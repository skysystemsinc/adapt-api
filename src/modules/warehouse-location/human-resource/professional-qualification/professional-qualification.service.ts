import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CreateProfessionalQualificationDto } from './dto/create-professional-qualification.dto';
import { ProfessionalQualification } from './entities/professional-qualification.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';
import { ClamAVService } from '../../../clamav/clamav.service';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { encryptBuffer, decryptBuffer } from 'src/common/utils/helper.utils';
import { WarehouseLocationService } from '../../warehouse-location.service';
import { AssignmentSection } from '../../../warehouse/operator/assignment/entities/assignment-section.entity';
import { Assignment, AssignmentLevel } from '../../../warehouse/operator/assignment/entities/assignment.entity';
import { AssignmentStatus } from '../../../warehouse/operator/assignment/entities/assignment.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../../entities/warehouse-location.entity';
import { ProfessionalQualificationHistory } from './entities/professional-qualification-history.entity';

@Injectable()
export class ProfessionalQualificationService {
  private readonly logger = new Logger(ProfessionalQualificationService.name);
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(ProfessionalQualification)
    private readonly professionalQualificationRepository: Repository<ProfessionalQualification>,
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
    @InjectRepository(ProfessionalQualificationHistory)
    private readonly professionalQualificationHistoryRepository: Repository<ProfessionalQualificationHistory>,
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
      relations: ['professionalCertificate', 'humanResource'],
    });
  
    if (!qualification) {
      throw new NotFoundException('Professional qualification not found');
    }
  
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: qualification.humanResource.warehouseLocationId },
    });
  
    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location not found');
    }
  
    if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED, WarehouseLocationStatus.RESUBMITTED].includes(warehouseLocation.status)) {
      throw new BadRequestException('Professional qualification can only be updated while application is in draft, rejected, or resubmitted status');
    }
  
    const { professionalCertificate, ...qualificationData } = updateProfessionalQualificationDto;
  
    const result = await this.dataSource.transaction(async (manager) => {
      const qualRepo = manager.getRepository(ProfessionalQualification);
      const qualHistoryRepo = manager.getRepository(ProfessionalQualificationHistory);
  
      if (warehouseLocation.status === WarehouseLocationStatus.REJECTED) {
        const historyRecord = qualHistoryRepo.create({
          professionalQualificationId: qualification.id,
          humanResourceId: qualification.humanResourceId,
          certificationTitle: qualification.certificationTitle,
          issuingBody: qualification.issuingBody,
          country: qualification.country,
          dateOfAward: qualification.dateOfAward ?? null,
          membershipNumber: qualification.membershipNumber,
          hasExpiryDate: qualification.hasExpiryDate,
          professionalCertificate: qualification.professionalCertificate ?? null,
          isActive: false,
        } as Partial<ProfessionalQualificationHistory>);
        historyRecord.createdAt = qualification.createdAt;
        await qualHistoryRepo.save(historyRecord);
      }
  
      Object.assign(qualification, qualificationData);
      return qualRepo.save(qualification);
    });
  
    // Handle file upload/update (outside transaction)
    if (certificateFile) {
      if (qualification.professionalCertificate) {
        await this.deleteWarehouseDocument(qualification.professionalCertificate.id);
      }
  
      const documentResult = await this.uploadWarehouseDocument(
        certificateFile,
        userId,
        'ProfessionalQualification',
        result.id,
        'professionalCertificate'
      );
  
      const certificateDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });
  
      if (certificateDocument) {
        result.professionalCertificate = certificateDocument;
        await this.professionalQualificationRepository.save(result);
      }
    } else {
      if (professionalCertificate && typeof professionalCertificate === 'string') {
        const existingDocument = await this.warehouseDocumentRepository.findOne({
          where: { 
            id: professionalCertificate,
            documentableType: 'ProfessionalQualification',
            documentableId: result.id,
            documentType: 'professionalCertificate'
          }
        });
  
        if (!existingDocument) {
          throw new BadRequestException('Invalid document ID provided or document does not belong to this qualification');
        }
  
        result.professionalCertificate = existingDocument;
        await this.professionalQualificationRepository.save(result);
      } else {
        result.professionalCertificate = qualification.professionalCertificate;
        await this.professionalQualificationRepository.save(result);
      }
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
            resourceId: qualification.id,
          },
        });
  
        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }
  
      await this.warehouseLocationService.trackWarehouseLocationResubmissionAndUpdateStatus(
        warehouseLocation.id,
        '7-human-resources',
        qualification.id,
        assignmentSectionId ?? undefined,
      );
    }
  
    return result;
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
