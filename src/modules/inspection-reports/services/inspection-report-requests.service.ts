import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { encryptBuffer, decryptBuffer } from 'src/common/utils/helper.utils';
import { InspectionReportRequest, InspectionReportRequestStatus } from '../entities/inspection-report-request.entity';
import { AssessmentSubmissionRequest } from '../entities/assessment-submission-request.entity';
import { InspectionReport, InspectionReportStatus } from '../entities/inspection-report.entity';
import { AssessmentSubmission } from '../../expert-assessment/assessment-submission/entities/assessment-submission.entity';
import { AssessmentDocument } from '../../expert-assessment/assessment-documents/entities/assessment-document.entity';
import { AssessmentSubSection } from '../../expert-assessment/assessment-sub-section/entities/assessment-sub-section.entity';
import { AssessmentCategory, ExpertAssessment } from '../../expert-assessment/entities/expert-assessment.entity';
import { CreateInspectionReportRequestDto } from '../dto/create-inspection-report-request.dto';
import { ReviewInspectionReportRequestDto } from '../dto/review-inspection-report-request.dto';
import { InspectionReportRequestResponseDto, AssessmentSubmissionRequestResponseDto } from '../dto/inspection-report-request-response.dto';
import { QueryInspectionReportRequestsDto } from '../dto/query-inspection-report-requests.dto';
import { ClamAVService } from '../../clamav/clamav.service';

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx', '.xls', '.xlsx', '.csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const REQUEST_UPLOAD_DIR = 'uploads/inspection-requests';
const FINAL_UPLOAD_DIR = 'uploads/assessment-documents';
const FINAL_INSPECTION_REPORTS_DIR = 'uploads/inspection-reports';

@Injectable()
export class InspectionReportRequestsService {
  private readonly logger = new Logger(InspectionReportRequestsService.name);

  constructor(
    @InjectRepository(InspectionReportRequest)
    private readonly inspectionReportRequestRepository: Repository<InspectionReportRequest>,
    @InjectRepository(AssessmentSubmissionRequest)
    private readonly assessmentRequestRepository: Repository<AssessmentSubmissionRequest>,
    @InjectRepository(InspectionReport)
    private readonly inspectionReportRepository: Repository<InspectionReport>,
    @InjectRepository(AssessmentSubmission)
    private readonly assessmentSubmissionRepository: Repository<AssessmentSubmission>,
    @InjectRepository(AssessmentDocument)
    private readonly assessmentDocumentRepository: Repository<AssessmentDocument>,
    @InjectRepository(AssessmentSubSection)
    private readonly assessmentSubSectionRepository: Repository<AssessmentSubSection>,
    @InjectRepository(ExpertAssessment)
    private readonly expertAssessmentRepository: Repository<ExpertAssessment>,
    private readonly dataSource: DataSource,
    private readonly clamAVService: ClamAVService,
  ) {
    this.ensureUploadDirectories();
  }

  private async ensureUploadDirectories(): Promise<void> {
    try {
      await fs.access(REQUEST_UPLOAD_DIR);
    } catch {
      await fs.mkdir(REQUEST_UPLOAD_DIR, { recursive: true });
      this.logger.log(`📁 Created request upload directory: ${REQUEST_UPLOAD_DIR}`);
    }
  }

  /**
   * Create an inspection report request for approval
   */
  async create(
    createDto: CreateInspectionReportRequestDto,
    files: any[],
    globalDocumentFile: any,
    requestedBy?: string,
  ): Promise<InspectionReportRequestResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate existing inspection report if updating
      let existingReport: InspectionReport | null = null;
      if (createDto.inspectionReportId) {
        existingReport = await this.inspectionReportRepository.findOne({
          where: { id: createDto.inspectionReportId },
        });

        if (!existingReport) {
          throw new NotFoundException(
            `Inspection report with ID '${createDto.inspectionReportId}' not found`,
          );
        }

        // Check for pending requests for this report
        const pendingRequest = await this.inspectionReportRequestRepository.findOne({
          where: {
            inspectionReportId: createDto.inspectionReportId,
            status: InspectionReportRequestStatus.PENDING,
          },
        });

        if (pendingRequest) {
          throw new BadRequestException(
            'This inspection report already has a pending request. Please resolve it first.',
          );
        }
      }

      // Validate: prevent multiple pending requests for same application/location and assessment type
      const whereClause: any = {
        assessmentType: createDto.assessmentType,
        status: InspectionReportRequestStatus.PENDING,
      };

      if (createDto.warehouseOperatorApplicationId) {
        whereClause.warehouseOperatorApplicationId = createDto.warehouseOperatorApplicationId;
      }
      if (createDto.warehouseLocationId) {
        whereClause.warehouseLocationId = createDto.warehouseLocationId;
      }

      const existingPendingRequest = await this.inspectionReportRequestRepository.findOne({
        where: whereClause,
      });

      if (existingPendingRequest) {
        throw new BadRequestException(
          'A pending request already exists for this application/location and assessment type. Please resolve it first.',
        );
      }

      // Handle global document upload
      if (!globalDocumentFile) {
        throw new BadRequestException('Global document is required');
      }

      // Validate global document
      const globalFileExtension = path.extname(globalDocumentFile.originalname).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(globalFileExtension)) {
        throw new BadRequestException(
          `Global document file type '${globalFileExtension}' is not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
        );
      }

      if (globalDocumentFile.size > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `Global document file size ${(globalDocumentFile.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB`,
        );
      }

      // Scan global document with ClamAV
      const isMandatory = this.clamAVService.getScanMandatory();
      if (isMandatory) {
        try {
          this.logger.log(`🔍 Scanning global document with ClamAV: ${globalDocumentFile.originalname}`);
          const scanResult = await this.clamAVService.scanBuffer(
            globalDocumentFile.buffer,
            globalDocumentFile.originalname,
          );

          if (scanResult.isInfected) {
            throw new BadRequestException(
              `Global document is infected with malware: ${scanResult.viruses.join(', ')}. Upload rejected.`,
            );
          }
          this.logger.log(`✅ Global document passed ClamAV scan: ${globalDocumentFile.originalname}`);
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error;
          }
          if (isMandatory) {
            throw new BadRequestException(
              `Virus scanning unavailable: ${error.message}. Upload blocked due to mandatory scanning.`,
            );
          } else {
            this.logger.warn(
              `ClamAV scan failed for global document ${globalDocumentFile.originalname}: ${error.message}. Bypassing scan.`,
            );
          }
        }
      }

      // Store global document temporarily in request directory
      const globalSanitizedFilename = `request-${uuidv4()}${globalFileExtension}`;
      const globalFilePath = path.join(REQUEST_UPLOAD_DIR, globalSanitizedFilename);
      const { encrypted: globalEncrypted, iv: globalIv, authTag: globalAuthTag } = encryptBuffer(globalDocumentFile.buffer);
      await fs.writeFile(globalFilePath, globalEncrypted);

      // Store original data snapshot if updating
      let originalData: any = undefined;
      if (existingReport) {
        originalData = {
          maximumScore: existingReport.maximumScore,
          obtainedScore: existingReport.obtainedScore,
          percentage: existingReport.percentage,
          grade: existingReport.grade,
          selectedGrade: existingReport.selectedGrade,
          assessmentGradingRemarks: existingReport.assessmentGradingRemarks,
          overallComments: existingReport.overallComments,
        };
      }

      // Create inspection report request
      const { assessments, ...reportData } = createDto;
      const inspectionReportRequest = this.inspectionReportRequestRepository.create({
        ...reportData,
        inspectionReportId: createDto.inspectionReportId || null,
        globalDocumentPath: globalFilePath,
        globalDocumentIv: globalIv,
        globalDocumentAuthTag: globalAuthTag,
        globalDocumentMimeType: globalDocumentFile.mimetype || 'application/octet-stream',
        globalDocumentOriginalName: globalDocumentFile.originalname,
        status: InspectionReportRequestStatus.PENDING,
        requestedBy: requestedBy || null,
        originalData,
      });

      const savedRequest = await queryRunner.manager.save(InspectionReportRequest, inspectionReportRequest);

      // Create assessment requests
      const assessmentRequests: AssessmentSubmissionRequest[] = [];
      for (let i = 0; i < assessments.length; i++) {
        const assessmentData = assessments[i];
        const file = files && files[i] ? files[i] : null;

        // Validate and store file if provided
        let filePath: string | undefined;
        let fileIv: string | undefined;
        let fileAuthTag: string | undefined;
        let fileMimeType: string | undefined;
        let fileOriginalName: string | undefined;

        if (file) {
          const fileExtension = path.extname(file.originalname).toLowerCase();
          if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
            throw new BadRequestException(
              `File type '${fileExtension}' is not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
            );
          }

          if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException(
              `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB`,
            );
          }

          // Scan file with ClamAV
          if (isMandatory) {
            try {
              const scanResult = await this.clamAVService.scanBuffer(file.buffer, file.originalname);
              if (scanResult.isInfected) {
                throw new BadRequestException(
                  `File is infected with malware: ${scanResult.viruses.join(', ')}. Upload rejected.`,
                );
              }
            } catch (error) {
              if (error instanceof BadRequestException) {
                throw error;
              }
              if (isMandatory) {
                throw new BadRequestException(
                  `Virus scanning unavailable: ${error.message}. Upload blocked.`,
                );
              }
            }
          }

          // Store file temporarily
          const sanitizedFilename = `request-${uuidv4()}${fileExtension}`;
          filePath = path.join(REQUEST_UPLOAD_DIR, sanitizedFilename);
          const { encrypted, iv, authTag } = encryptBuffer(file.buffer);
          await fs.writeFile(filePath, encrypted);
          fileIv = iv;
          fileAuthTag = authTag;
          fileMimeType = file.mimetype || 'application/octet-stream';
          fileOriginalName = file.originalname;
        }

        // Get original data if updating existing submission
        let originalAssessmentData: any = undefined;
        if (existingReport) {
          const existingSubmission = await this.assessmentSubmissionRepository.findOne({
            where: {
              inspectionReportId: existingReport.id,
              assessmentId: assessmentData.assessmentId,
            },
            relations: ['documents'],
          });

          if (existingSubmission) {
            originalAssessmentData = {
              score: existingSubmission.score,
              remarks: existingSubmission.remarks,
            };
            if (existingSubmission.documents && existingSubmission.documents.length > 0) {
              const doc = existingSubmission.documents[0];
              originalAssessmentData.filePath = doc.filePath;
              originalAssessmentData.fileMimeType = doc.fileType;
              originalAssessmentData.fileOriginalName = doc.fileName;
            }
          }
        }

        const assessmentRequest = this.assessmentRequestRepository.create({
          inspectionReportRequestId: savedRequest.id,
          assessmentId: assessmentData.assessmentId,
          score: assessmentData.score,
          remarks: assessmentData.remarks,
          filePath,
          fileIv,
          fileAuthTag,
          fileMimeType,
          fileOriginalName,
          originalData: originalAssessmentData,
        });

        assessmentRequests.push(assessmentRequest);
      }

      await queryRunner.manager.save(AssessmentSubmissionRequest, assessmentRequests);

      await queryRunner.commitTransaction();

      return this.findOne(savedRequest.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get all inspection report requests with pagination and search
   */
  async findAll(
    query: QueryInspectionReportRequestsDto,
  ): Promise<{
    data: InspectionReportRequestResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.inspectionReportRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.assessmentRequests', 'assessmentRequests')
      .skip(skip)
      .take(limit)
      .orderBy('request.createdAt', 'DESC');

    // Apply search filter
    if (search) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        '(request.assessmentType::text LIKE :search OR request.warehouseOperatorApplicationId::text LIKE :search OR request.warehouseLocationId::text LIKE :search)',
        { search: searchTerm },
      );
    }

    const [requests, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    const data = await this.buildResponseDtos(requests);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get a single inspection report request by ID
   */
  async findOne(id: string): Promise<InspectionReportRequestResponseDto> {
    const request = await this.inspectionReportRequestRepository.findOne({
      where: { id },
      relations: ['assessmentRequests'],
    });

    if (!request) {
      throw new NotFoundException(`Inspection report request with ID '${id}' not found`);
    }

    return (await this.buildResponseDtos([request]))[0];
  }

  /**
   * Review (approve/reject) an inspection report request
   */
  async review(
    id: string,
    reviewDto: ReviewInspectionReportRequestDto,
    reviewedBy: string,
  ): Promise<InspectionReportRequestResponseDto> {
    const request = await this.inspectionReportRequestRepository.findOne({
      where: { id },
      relations: ['assessmentRequests'],
    });

    if (!request) {
      throw new NotFoundException(`Inspection report request with ID '${id}' not found`);
    }

    if (request.status !== InspectionReportRequestStatus.PENDING) {
      throw new BadRequestException(
        `Inspection report request is already ${request.status}. Only pending requests can be reviewed.`,
      );
    }

    // Update request status
    request.status = reviewDto.status;
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewDto.reviewNotes || null;

    await this.inspectionReportRequestRepository.save(request);

    // If approved, apply the changes to create actual inspection report
    if (reviewDto.status === InspectionReportRequestStatus.APPROVED) {
      await this.applyApprovedRequest(request);
    } else {
      // If rejected, clean up temporary files
      await this.cleanupRejectedRequestFiles(request);
    }

    return this.findOne(id);
  }

  /**
   * Apply approved request to create actual inspection report
   */
  private async applyApprovedRequest(request: InspectionReportRequest): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      // Ensure final upload directories exist
      try {
        await fs.access(FINAL_UPLOAD_DIR);
      } catch {
        await fs.mkdir(FINAL_UPLOAD_DIR, { recursive: true });
      }
      try {
        await fs.access(FINAL_INSPECTION_REPORTS_DIR);
      } catch {
        await fs.mkdir(FINAL_INSPECTION_REPORTS_DIR, { recursive: true });
      }

      // Move global document from request location to final location
      let finalGlobalDocumentPath: string;
      if (request.globalDocumentPath) {
        const globalFileExtension = path.extname(request.globalDocumentPath);
        const finalGlobalFilename = `${uuidv4()}${globalFileExtension}`;
        const finalGlobalPath = path.join(FINAL_INSPECTION_REPORTS_DIR, finalGlobalFilename);
        
        try {
          await fs.rename(request.globalDocumentPath, finalGlobalPath);
          finalGlobalDocumentPath = `/uploads/inspection-reports/${finalGlobalFilename}`;
          this.logger.log(`📁 Moved global document to final location: ${finalGlobalPath}`);
        } catch (error) {
          this.logger.error(`Failed to move global document from ${request.globalDocumentPath} to ${finalGlobalPath}`, error);
          throw new BadRequestException('Failed to process global document for approved request');
        }
      } else {
        throw new BadRequestException('Global document path is missing');
      }

      // Create inspection report
      const inspectionReport = manager.create(InspectionReport, {
        assessmentType: request.assessmentType as AssessmentCategory,
        maximumScore: request.maximumScore,
        obtainedScore: request.obtainedScore,
        percentage: request.percentage,
        grade: request.grade,
        selectedGrade: request.selectedGrade,
        assessmentGradingRemarks: request.assessmentGradingRemarks,
        overallComments: request.overallComments,
        warehouseOperatorApplicationId: request.warehouseOperatorApplicationId,
        warehouseLocationId: request.warehouseLocationId,
        createdBy: request.requestedBy ?? undefined,
        status: InspectionReportStatus.PENDING,
      });

      const savedReport = await manager.save(InspectionReport, inspectionReport);

      // Create global document as AssessmentDocument
      const globalDocument = manager.create(AssessmentDocument, {
        inspectionReportId: savedReport.id,
        fileName: request.globalDocumentOriginalName || 'global-document',
        filePath: finalGlobalDocumentPath,
        fileType: request.globalDocumentMimeType || 'application/octet-stream',
        fileSize: 0, // Size not stored in request
        documentType: 'global_document',
        uploadedBy: request.requestedBy ?? undefined,
        iv: request.globalDocumentIv,
        authTag: request.globalDocumentAuthTag,
      });

      await manager.save(AssessmentDocument, globalDocument);

      // Create assessment submissions and move files
      const submissionMap = new Map<string, AssessmentSubmission>();

      for (const assessmentRequest of request.assessmentRequests) {
        // Resolve actual assessment ID (could be sub-section or assessment)
        let actualAssessmentId: string;
        const subSection = await manager.findOne(AssessmentSubSection, {
          where: { id: assessmentRequest.assessmentId },
        });

        if (subSection) {
          actualAssessmentId = subSection.assessmentId;
        } else {
          const assessment = await manager.findOne(ExpertAssessment, {
            where: { id: assessmentRequest.assessmentId },
          });

          if (!assessment) {
            throw new BadRequestException(
              `Assessment or sub-section with ID ${assessmentRequest.assessmentId} not found`,
            );
          }

          actualAssessmentId = assessment.id;
        }

        // Create assessment submission
        const submission = manager.create(AssessmentSubmission, {
          assessmentId: actualAssessmentId,
          score: assessmentRequest.score,
          remarks: assessmentRequest.remarks,
          inspectionReportId: savedReport.id,
          warehouseOperatorApplicationId: request.warehouseOperatorApplicationId,
          warehouseLocationId: request.warehouseLocationId,
        });

        const savedSubmission = await manager.save(AssessmentSubmission, submission);
        submissionMap.set(assessmentRequest.assessmentId, savedSubmission);

        // Move file from request location to final location if exists
        if (assessmentRequest.filePath) {
          const fileExtension = path.extname(assessmentRequest.filePath);
          const finalFilename = `${uuidv4()}${fileExtension}`;
          const finalPath = path.join(FINAL_UPLOAD_DIR, finalFilename);
          const finalDocumentPath = `/uploads/assessment-documents/${finalFilename}`;

          try {
            await fs.rename(assessmentRequest.filePath, finalPath);
            this.logger.log(`📁 Moved assessment file to final location: ${finalPath}`);

            // Create document record
            const document = manager.create(AssessmentDocument, {
              submissionId: savedSubmission.id,
              fileName: assessmentRequest.fileOriginalName || 'document',
              filePath: finalDocumentPath,
              fileType: assessmentRequest.fileMimeType || 'application/octet-stream',
              fileSize: 0,
              documentType: 'supporting_document',
              uploadedBy: request.requestedBy ?? undefined,
              iv: assessmentRequest.fileIv,
              authTag: assessmentRequest.fileAuthTag,
            });

            await manager.save(AssessmentDocument, document);
          } catch (error) {
            this.logger.error(
              `Failed to move file from ${assessmentRequest.filePath} to ${finalPath}`,
              error,
            );
            throw new BadRequestException('Failed to process file for approved request');
          }
        }
      }

      // Update request with created report ID
      request.inspectionReportId = savedReport.id;
      await manager.save(InspectionReportRequest, request);
    });
  }

  /**
   * Clean up files for rejected requests
   */
  private async cleanupRejectedRequestFiles(request: InspectionReportRequest): Promise<void> {
    try {
      // Delete global document
      if (request.globalDocumentPath) {
        try {
          await fs.unlink(request.globalDocumentPath);
          this.logger.log(`🗑️  Deleted rejected global document: ${request.globalDocumentPath}`);
        } catch (error) {
          this.logger.warn(`Failed to delete rejected global document: ${request.globalDocumentPath}`, error);
        }
      }

      // Delete assessment files
      for (const assessmentRequest of request.assessmentRequests || []) {
        if (assessmentRequest.filePath) {
          try {
            await fs.unlink(assessmentRequest.filePath);
            this.logger.log(`🗑️  Deleted rejected assessment file: ${assessmentRequest.filePath}`);
          } catch (error) {
            this.logger.warn(`Failed to delete rejected assessment file: ${assessmentRequest.filePath}`, error);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error cleaning up rejected request files', error);
      // Don't throw - cleanup failures shouldn't block the rejection
    }
  }

  /**
   * Delete a pending inspection report request
   */
  async remove(id: string): Promise<{ message: string }> {
    const request = await this.inspectionReportRequestRepository.findOne({
      where: { id },
      relations: ['assessmentRequests'],
    });

    if (!request) {
      throw new NotFoundException(`Inspection report request with ID '${id}' not found`);
    }

    if (request.status !== InspectionReportRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot delete ${request.status} request. Only pending requests can be deleted.`,
      );
    }

    // Clean up files before deleting
    await this.cleanupRejectedRequestFiles(request);

    await this.inspectionReportRequestRepository.remove(request);

    return { message: `Inspection report request with ID '${id}' has been deleted successfully` };
  }

  /**
   * Download a document from an inspection report request
   */
  async downloadDocument(
    requestId: string,
    type: 'global' | 'assessment',
    filePath?: string,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const request = await this.inspectionReportRequestRepository.findOne({
      where: { id: requestId },
      relations: ['assessmentRequests'],
    });

    if (!request) {
      throw new NotFoundException(`Inspection report request with ID '${requestId}' not found`);
    }

    let documentPath: string | undefined;
    let documentIv: string | undefined;
    let documentAuthTag: string | undefined;
    let documentMimeType: string | undefined;
    let documentOriginalName: string | undefined;

    if (type === 'global') {
      documentPath = filePath || request.globalDocumentPath;
      documentIv = request.globalDocumentIv;
      documentAuthTag = request.globalDocumentAuthTag;
      documentMimeType = request.globalDocumentMimeType;
      documentOriginalName = request.globalDocumentOriginalName;
    } else {
      // For assessment documents, we need the filePath to identify which assessment
      if (!filePath) {
        throw new BadRequestException('File path is required for assessment documents');
      }
      const assessmentRequest = request.assessmentRequests.find(
        (ar) => ar.filePath === filePath,
      );
      if (!assessmentRequest) {
        throw new NotFoundException('Assessment document not found in request');
      }
      documentPath = assessmentRequest.filePath;
      documentIv = assessmentRequest.fileIv;
      documentAuthTag = assessmentRequest.fileAuthTag;
      documentMimeType = assessmentRequest.fileMimeType;
      documentOriginalName = assessmentRequest.fileOriginalName;
    }

    if (!documentPath) {
      throw new NotFoundException('Document path not found');
    }

    // Check if file exists
    if (!fsSync.existsSync(documentPath)) {
      throw new NotFoundException('File not found on disk');
    }

    // Read encrypted file
    const encryptedBuffer = fsSync.readFileSync(documentPath);

    // Decrypt if iv and authTag are present
    let decryptedBuffer: Buffer;
    if (documentIv && documentAuthTag) {
      try {
        decryptedBuffer = decryptBuffer(encryptedBuffer, documentIv, documentAuthTag);
      } catch (error: any) {
        throw new BadRequestException(`Failed to decrypt document: ${error.message}`);
      }
    } else {
      // Backward compatibility - assume unencrypted
      decryptedBuffer = encryptedBuffer;
    }

    return {
      buffer: decryptedBuffer,
      mimeType: documentMimeType || 'application/octet-stream',
      filename: documentOriginalName || 'document',
    };
  }

  /**
   * Build response DTOs
   */
  private async buildResponseDtos(
    requests: InspectionReportRequest[],
  ): Promise<InspectionReportRequestResponseDto[]> {
    return requests.map((request) => {
      const assessmentRequests = (request.assessmentRequests || []).map((ar) =>
        plainToInstance(
          AssessmentSubmissionRequestResponseDto,
          {
            ...ar,
            originalData: ar.originalData,
          },
          { excludeExtraneousValues: true },
        ),
      );

      return plainToInstance(
        InspectionReportRequestResponseDto,
        {
          ...request,
          assessmentRequests,
          originalData: request.originalData,
        },
        { excludeExtraneousValues: true },
      );
    });
  }
}

