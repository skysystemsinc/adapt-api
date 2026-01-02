import { Injectable, Logger, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CreateAcademicQualificationDto } from './dto/create-academic-qualification.dto';
import { AcademicQualification } from './entities/academic-qualification.entity';
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
import { AcademicQualificationHistory } from './entities/academic-qualification-history.entity';
@Injectable()
export class AcademicQualificationService {
  private readonly logger = new Logger(AcademicQualificationService.name);
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(AcademicQualification)
    private readonly academicQualificationRepository: Repository<AcademicQualification>,
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
    @InjectRepository(AcademicQualificationHistory)
    private readonly academicQualificationHistoryRepository: Repository<AcademicQualificationHistory>,
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

  async create(
    hrId: string,
    createAcademicQualificationDto: CreateAcademicQualificationDto,
    userId: string
  ) {
    const humanResource = await this.humanResourceRepository.findOne({
      where: { id: hrId },
    });

    if (!humanResource) {
      throw new NotFoundException('HR entry not found');
    }

    const { academicCertificate, academicCertificateFileName, academicCertificateMimeType, ...qualificationData } = createAcademicQualificationDto;

    const qualification = this.academicQualificationRepository.create({
      humanResourceId: hrId,
      ...qualificationData,
    });

    const savedQualification = await this.academicQualificationRepository.save(qualification);

    // Process base64 certificate file if provided
    let certificateFile: any = null;
    let isDocumentId = false;
    
    if (academicCertificate) {
      // Check if it's base64 (starts with "data:" or is a very long string without dashes)
      const isBase64 = academicCertificate.startsWith('data:') || 
                      (!academicCertificate.includes('-') && academicCertificate.length > 50);
      
      if (isBase64) {
        if (!academicCertificateFileName) {
          throw new BadRequestException('academicCertificateFileName is required when academicCertificate is base64');
        }
        certificateFile = this.convertBase64ToFile(
          academicCertificate,
          academicCertificateFileName,
          academicCertificateMimeType
        );
      } else {
        isDocumentId = true;
      }
    }

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
    } else if (isDocumentId && academicCertificate) {
      // Link existing document
      const existingDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: academicCertificate }
      });

      if (!existingDocument) {
        throw new BadRequestException('Invalid document ID provided');
      }

      // Update document to link to this qualification
      existingDocument.documentableType = 'AcademicQualification';
      existingDocument.documentableId = savedQualification.id;
      existingDocument.documentType = 'academicCertificate';
      await this.warehouseDocumentRepository.save(existingDocument);

      savedQualification.academicCertificate = existingDocument;
      await this.academicQualificationRepository.save(savedQualification);
    }

    return savedQualification;
  }

  async update(
    qualId: string,
    hrId: string,
    updateAcademicQualificationDto: CreateAcademicQualificationDto,
    userId: string
  ) {
    const qualification = await this.academicQualificationRepository.findOne({
      where: { id: qualId, humanResourceId: hrId },
      relations: ['academicCertificate', 'humanResource'],
    });
  
    if (!qualification) {
      throw new NotFoundException('Academic qualification not found');
    }
  
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: qualification.humanResource.warehouseLocationId },
    });
  
    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location not found');
    }
  
    if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED, WarehouseLocationStatus.RESUBMITTED].includes(warehouseLocation.status)) {
      throw new BadRequestException('Academic qualification can only be updated while application is in draft, rejected, or resubmitted status');
    }
  
    const { academicCertificate, academicCertificateFileName, academicCertificateMimeType, ...qualificationData } = updateAcademicQualificationDto;
    
    // Process base64 certificate file if provided
    let certificateFile: any = null;
    let isDocumentId = false;
    
    if (academicCertificate) {
      // Check if it's base64 (starts with "data:" or is a very long string without dashes)
      const isBase64 = academicCertificate.startsWith('data:') || 
                      (!academicCertificate.includes('-') && academicCertificate.length > 50);
      
      if (isBase64) {
        if (!academicCertificateFileName) {
          throw new BadRequestException('academicCertificateFileName is required when academicCertificate is base64');
        }
        certificateFile = this.convertBase64ToFile(
          academicCertificate,
          academicCertificateFileName,
          academicCertificateMimeType
        );
      } else {
        isDocumentId = true;
      }
    }
  
    const result = await this.dataSource.transaction(async (manager) => {
      const qualRepo = manager.getRepository(AcademicQualification);
      const qualHistoryRepo = manager.getRepository(AcademicQualificationHistory);
  
      if (warehouseLocation.status === WarehouseLocationStatus.REJECTED) {
        const historyRecord = qualHistoryRepo.create({
          academicQualificationId: qualification.id,
          humanResourceId: qualification.humanResourceId,
          degree: qualification.degree,
          major: qualification.major,
          institute: qualification.institute,
          country: qualification.country,
          yearOfPassing: qualification.yearOfPassing,
          grade: qualification.grade,
          academicCertificate: qualification.academicCertificate ?? null,
          isActive: false,
        } as Partial<AcademicQualificationHistory>);
        historyRecord.createdAt = qualification.createdAt;
        await qualHistoryRepo.save(historyRecord);
      }
  
      Object.assign(qualification, qualificationData);
      return qualRepo.save(qualification);
    });
  
    // Handle file upload/update (outside transaction)
    if (certificateFile) {
      // New base64 file - delete old one if exists
      if (qualification.academicCertificate) {
        await this.deleteWarehouseDocument(qualification.academicCertificate.id);
      }

      const documentResult = await this.uploadWarehouseDocument(
        certificateFile,
        userId,
        'AcademicQualification',
        result.id,
        'academicCertificate'
      );

      const certificateDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (certificateDocument) {
        result.academicCertificate = certificateDocument;
        await this.academicQualificationRepository.save(result);
      }
    } else if (isDocumentId && academicCertificate) {
      // Existing document ID - verify and link
      const existingDocument = await this.warehouseDocumentRepository.findOne({
        where: { 
          id: academicCertificate,
          documentableType: 'AcademicQualification',
          documentableId: result.id,
          documentType: 'academicCertificate'
        }
      });

      if (!existingDocument) {
        throw new BadRequestException('Invalid document ID provided or document does not belong to this qualification');
      }

      result.academicCertificate = existingDocument;
      await this.academicQualificationRepository.save(result);
    } else {
      // No certificate provided - keep existing
      result.academicCertificate = qualification.academicCertificate;
      await this.academicQualificationRepository.save(result);
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
