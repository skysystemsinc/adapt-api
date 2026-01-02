import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
import { WarehouseLocationService } from '../warehouse-location.service';
import { AssignmentSection } from '../../warehouse/operator/assignment/entities/assignment-section.entity';
import { Assignment, AssignmentLevel } from '../../warehouse/operator/assignment/entities/assignment.entity';
import { In } from 'typeorm';
import { WeighingHistory } from './entities/weighing-history.entity';
import { AssignmentStatus } from '../../../utilites/enum';

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


    private readonly dataSource: DataSource,

    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,

    @InjectRepository(AssignmentSection)
    private readonly assignmentSectionRepository: Repository<AssignmentSection>,

    @Inject(forwardRef(() => WarehouseLocationService))
    private readonly warehouseLocationService: WarehouseLocationService,
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

  /**
   * Convert base64 string to file-like object (Multer-compatible)
   */
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
    if (isMandatory) {
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
    userId: string
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

    // Extract certificate data from DTO
    const {
      weighbridgeCalibrationCertificate,
      weighbridgeCalibrationCertificateFileName,
      weighbridgeCalibrationCertificateMimeType,
      ...weighingData
    } = createWeighingDto;

    // Validate that certificate is provided (for create, it's required)
    if (!weighbridgeCalibrationCertificate || (typeof weighbridgeCalibrationCertificate === 'string' && weighbridgeCalibrationCertificate.trim() === '')) {
      throw new BadRequestException('Weighbridge calibration certificate file is required');
    }

    // Convert base64 to file-like object if it's a base64 string
    let certificateFile: any = null;
    let isDocumentId = false;

    // Check if it's a base64 string (starts with 'data:' or is a long string) or a document ID (UUID format)
    if (weighbridgeCalibrationCertificate.startsWith('data:') || 
        (!weighbridgeCalibrationCertificate.includes('-') && weighbridgeCalibrationCertificate.length > 50)) {
      // It's a base64 string
      if (!weighbridgeCalibrationCertificateFileName) {
        throw new BadRequestException('weighbridgeCalibrationCertificateFileName is required when certificate is base64');
      }
      certificateFile = this.convertBase64ToFile(
        weighbridgeCalibrationCertificate,
        weighbridgeCalibrationCertificateFileName,
        weighbridgeCalibrationCertificateMimeType
      );
    } else {
      // It's likely a document ID - we'll handle it differently
      isDocumentId = true;
    }

    const existingWeighing = await this.weighingRepository.findOne({
      where: { warehouseLocationId },
      relations: ['weighbridgeCalibrationCertificate'],
    });

    if (existingWeighing) {
      Object.assign(existingWeighing, weighingData);
      const savedWeighing = await this.weighingRepository.save(existingWeighing);

      // Handle certificate: base64 file or document ID
      if (isDocumentId) {
        // If it's a document ID, verify it exists and link it
        const existingDocument = await this.warehouseDocumentRepository.findOne({
          where: { id: weighbridgeCalibrationCertificate }
        });
        if (!existingDocument) {
          throw new BadRequestException('Invalid document ID provided');
        }
        // Delete old file if it exists and is different
        if (savedWeighing.weighbridgeCalibrationCertificate && 
            savedWeighing.weighbridgeCalibrationCertificate.id !== weighbridgeCalibrationCertificate) {
          await this.deleteWarehouseDocument(savedWeighing.weighbridgeCalibrationCertificate.id);
        }
        savedWeighing.weighbridgeCalibrationCertificate = existingDocument;
      } else {
        // Delete old file if it exists
        if (savedWeighing.weighbridgeCalibrationCertificate) {
          await this.deleteWarehouseDocument(savedWeighing.weighbridgeCalibrationCertificate.id);
        }

        // Upload and link the certificate file
        const documentResult = await this.uploadWarehouseDocument(
          certificateFile,
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
        }
      }

      await this.weighingRepository.save(savedWeighing);
      return savedWeighing;
    }

    const weighing = this.weighingRepository.create({
      warehouseLocationId,
      ...weighingData,
    });

    const savedWeighing = await this.weighingRepository.save(weighing);

    // Handle certificate: base64 file or document ID
    if (isDocumentId) {
      // If it's a document ID, verify it exists and link it
      const existingDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: weighbridgeCalibrationCertificate }
      });
      if (!existingDocument) {
        throw new BadRequestException('Invalid document ID provided');
      }
      savedWeighing.weighbridgeCalibrationCertificate = existingDocument;
    } else {
      // Upload and link the certificate file
      const documentResult = await this.uploadWarehouseDocument(
        certificateFile,
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
      }
    }

    await this.weighingRepository.save(savedWeighing);

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
    userId: string
  ) {
    // Verify warehouse location exists and belongs to user
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED, WarehouseLocationStatus.RESUBMITTED].includes(warehouseLocation.status)) {
      throw new BadRequestException('Weighing can only be updated while application is in draft status');
    }

    const existingWeighing = await this.weighingRepository.findOne({
      where: { warehouseLocationId },
      relations: ['weighbridgeCalibrationCertificate'],
    });

    if (!existingWeighing) {
      throw new NotFoundException('Weighing not found for this application');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const weighingRepo = manager.getRepository(Weighing);
      const weighingHistoryRepo = manager.getRepository(WeighingHistory);

      // Re-validate application status inside transaction to prevent race conditions
      if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED].includes(warehouseLocation.status)) {
        throw new BadRequestException('Cannot update weighing after application is approved or submitted');
      }

      if (warehouseLocation.status === WarehouseLocationStatus.REJECTED) {
        // Save history of weighing if application is rejected (before overwriting)
        const historyRecord = weighingHistoryRepo.create({
          weighingId: existingWeighing.id,
          warehouseLocationId,
          weighbridgeAvailable: existingWeighing.weighbridgeAvailable,
          weighbridgeLocation: existingWeighing.weighbridgeLocation,
          weighbridgeCapacity: existingWeighing.weighbridgeCapacity,
          weighbridgeMakeModel: existingWeighing.weighbridgeMakeModel ?? null,
          weighbridgeInstallationDate: existingWeighing.weighbridgeInstallationDate ?? null,
          weighbridgeCalibrationStatus: existingWeighing.weighbridgeCalibrationStatus ?? null,
          weighbridgeNextCalibrationDueDate: existingWeighing.weighbridgeNextCalibrationDueDate ?? null,
          weighbridgeOwnerOperatorName: existingWeighing.weighbridgeOwnerOperatorName ?? null,
          weighbridgeAddressLocation: existingWeighing.weighbridgeAddressLocation ?? null,
          weighbridgeDistanceFromFacility: existingWeighing.weighbridgeDistanceFromFacility ?? null,
          weighbridgeCalibrationCertificate: existingWeighing.weighbridgeCalibrationCertificate ?? null,
          isActive: false,
        } as Partial<WeighingHistory>);
        historyRecord.createdAt = existingWeighing.createdAt;
        await weighingHistoryRepo.save(historyRecord);
      }

      // Extract certificate data from DTO (optional for updates)
      const {
        weighbridgeCalibrationCertificate,
        weighbridgeCalibrationCertificateFileName,
        weighbridgeCalibrationCertificateMimeType,
        ...weighingData
      } = updateWeighingDto;

      // If no certificate provided in update, keep existing one
      // The certificate handling will be done outside the transaction

      // Overwrite existing weighing with new information
      existingWeighing.weighbridgeAvailable = weighingData.weighbridgeAvailable;
      existingWeighing.weighbridgeLocation = weighingData.weighbridgeLocation;
      existingWeighing.weighbridgeCapacity = weighingData.weighbridgeCapacity;
      existingWeighing.weighbridgeMakeModel = weighingData.weighbridgeMakeModel ?? undefined;
      existingWeighing.weighbridgeInstallationDate = weighingData.weighbridgeInstallationDate ?? undefined;
      existingWeighing.weighbridgeCalibrationStatus = weighingData.weighbridgeCalibrationStatus ?? null;
      existingWeighing.weighbridgeNextCalibrationDueDate = weighingData.weighbridgeNextCalibrationDueDate ?? null;
      existingWeighing.weighbridgeOwnerOperatorName = weighingData.weighbridgeOwnerOperatorName ?? undefined;
      existingWeighing.weighbridgeAddressLocation = weighingData.weighbridgeAddressLocation ?? undefined;
      existingWeighing.weighbridgeDistanceFromFacility = weighingData.weighbridgeDistanceFromFacility ?? undefined;

      return { savedWeighing: await weighingRepo.save(existingWeighing), certificateData: {
        weighbridgeCalibrationCertificate,
        weighbridgeCalibrationCertificateFileName,
        weighbridgeCalibrationCertificateMimeType,
      } };
    });

    // Handle certificate upload/update (outside transaction)
    if (result.certificateData.weighbridgeCalibrationCertificate) {
      const {
        weighbridgeCalibrationCertificate,
        weighbridgeCalibrationCertificateFileName,
        weighbridgeCalibrationCertificateMimeType,
      } = result.certificateData;

      // Convert base64 to file-like object if it's a base64 string
      let certificateFile: any = null;
      let isDocumentId = false;

      // Check if it's a base64 string (starts with 'data:' or is a long string) or a document ID (UUID format)
      if (weighbridgeCalibrationCertificate.startsWith('data:') || 
          (!weighbridgeCalibrationCertificate.includes('-') && weighbridgeCalibrationCertificate.length > 50)) {
        // It's a base64 string
        if (!weighbridgeCalibrationCertificateFileName) {
          throw new BadRequestException('weighbridgeCalibrationCertificateFileName is required when certificate is base64');
        }
        certificateFile = this.convertBase64ToFile(
          weighbridgeCalibrationCertificate,
          weighbridgeCalibrationCertificateFileName,
          weighbridgeCalibrationCertificateMimeType
        );
      } else {
        // It's likely a document ID
        isDocumentId = true;
      }

      if (isDocumentId) {
        // If it's a document ID, verify it exists and link it
        const existingDocument = await this.warehouseDocumentRepository.findOne({
          where: { id: weighbridgeCalibrationCertificate }
        });
        if (!existingDocument) {
          throw new BadRequestException('Invalid document ID provided');
        }
        // Delete old file if it exists and is different
        if (result.savedWeighing.weighbridgeCalibrationCertificate && 
            result.savedWeighing.weighbridgeCalibrationCertificate.id !== weighbridgeCalibrationCertificate) {
          await this.deleteWarehouseDocument(result.savedWeighing.weighbridgeCalibrationCertificate.id);
        }
        result.savedWeighing.weighbridgeCalibrationCertificate = existingDocument;
      } else {
        // New file provided - delete old file and upload new one
        if (result.savedWeighing.weighbridgeCalibrationCertificate) {
          await this.deleteWarehouseDocument(result.savedWeighing.weighbridgeCalibrationCertificate.id);
        }

        const documentResult = await this.uploadWarehouseDocument(
          certificateFile,
          userId,
          'Weighing',
          result.savedWeighing.id,
          'weighbridgeCalibrationCertificate'
        );

        const certificateDocument = await this.warehouseDocumentRepository.findOne({
          where: { id: documentResult.id }
        });

        if (certificateDocument) {
          result.savedWeighing.weighbridgeCalibrationCertificate = certificateDocument;
          await this.weighingRepository.save(result.savedWeighing);
        }
      }
    }

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId },
    });

    // If application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseLocationStatus.REJECTED) {
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationLocationId: warehouseLocationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '5-weighing',
            resourceId: result.savedWeighing.id,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      await this.warehouseLocationService.trackWarehouseLocationResubmissionAndUpdateStatus(
        warehouseLocationId,
        '5-weighing',
        result.savedWeighing.id,
        assignmentSectionId ?? undefined,
      );
    }

    return result.savedWeighing;
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
