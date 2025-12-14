import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CreateInspectionReportDto } from './dto/create-inspection-report.dto';
import { UpdateInspectionReportDto } from './dto/update-inspection-report.dto';
import { InspectionReport, InspectionReportStatus } from './entities/inspection-report.entity';
import { AssessmentDocument } from '../expert-assessment/assessment-documents/entities/assessment-document.entity';
import { AssessmentSubmission } from '../expert-assessment/assessment-submission/entities/assessment-submission.entity';
import { AssessmentSubSection } from '../expert-assessment/assessment-sub-section/entities/assessment-sub-section.entity';
import { AssessmentCategory, ExpertAssessment } from '../expert-assessment/entities/expert-assessment.entity';
import { ReviewEntity } from '../warehouse/review/entities/review.entity';
import { Permissions } from '../rbac/constants/permissions.constants';
import { User } from '../users/entities/user.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Assignment, AssignmentLevel, AssignmentStatus } from '../warehouse/operator/assignment/entities/assignment.entity';
import { ApproveOrRejectInspectionReportDto, ApproveOrRejectInspectionReportStatus } from './dto/approve-reject-inspection';
import { InspectionReportHistory } from './entities/inspection-report-history.entity';
import { AssessmentSubmissionHistory } from '../expert-assessment/assessment-submission/entities/assessment-submission-history.entity';
import { AssignmentSection } from '../warehouse/operator/assignment/entities/assignment-section.entity';

@Injectable()
export class InspectionReportsService {
  constructor(
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
    @InjectRepository(ReviewEntity)
    private readonly reviewEntityRepository: Repository<ReviewEntity>,
    private readonly dataSource: DataSource
  ) { }

  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'assessment-documents');
  private readonly inspectionReportsUploadDir = path.join(process.cwd(), 'uploads', 'inspection-reports');

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  private async ensureInspectionReportsUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.inspectionReportsUploadDir);
    } catch {
      await fs.mkdir(this.inspectionReportsUploadDir, { recursive: true });
    }
  }

  async create(
    createInspectionReportDto: CreateInspectionReportDto,
    files: any[],
    globalDocumentFile: any,
    userId?: string
  ): Promise<InspectionReport> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Ensure upload directories exist
      await this.ensureUploadDirectory();
      await this.ensureInspectionReportsUploadDirectory();

      // Step 1: Handle Global Document Upload (required)
      if (!globalDocumentFile) {
        throw new BadRequestException('Global document is required');
      }

      // Validate global document file type
      const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx', '.xls', '.xlsx', '.csv'];
      const globalFileExtension = path.extname(globalDocumentFile.originalname).toLowerCase();

      if (!allowedExtensions.includes(globalFileExtension)) {
        throw new BadRequestException(
          `Global document file type '${globalFileExtension}' is not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
        );
      }

      // Validate global document file size (max 10MB)
      const maxSizeBytes = 10 * 1024 * 1024;
      if (globalDocumentFile.size > maxSizeBytes) {
        throw new BadRequestException(
          `Global document file size ${(globalDocumentFile.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB`,
        );
      }

      // Generate unique filename for global document
      const globalSanitizedFilename = `${uuidv4()}${globalFileExtension}`;
      const globalFilePath = path.join(this.inspectionReportsUploadDir, globalSanitizedFilename);
      const globalDocumentPath = `/uploads/inspection-reports/${globalSanitizedFilename}`;

      // Save global document to disk
      await fs.writeFile(globalFilePath, globalDocumentFile.buffer);

      // Step 2: Create Inspection Report
      const { assessments, ...reportData } = createInspectionReportDto;

      const inspectionReport = this.inspectionReportRepository.create({
        ...reportData,
        createdBy: userId,
      });

      const savedReport = await queryRunner.manager.save(InspectionReport, inspectionReport);

      // Step 2.5: Create Global Document as AssessmentDocument
      const globalDocument = this.assessmentDocumentRepository.create({
        inspectionReportId: savedReport.id,
        fileName: globalDocumentFile.originalname,
        filePath: globalDocumentPath,
        fileType: globalDocumentFile.mimetype || 'application/octet-stream',
        fileSize: globalDocumentFile.size,
        documentType: 'global_document',
        uploadedBy: userId,
      });

      await queryRunner.manager.save(AssessmentDocument, globalDocument);

      // Step 3: Create Assessment Submissions
      const submissionMap = new Map<string, AssessmentSubmission>(); // Map assessmentId -> submission

      for (const assessmentData of assessments) {
        // Resolve the actual assessment ID
        // The ID could be either an ExpertAssessment ID or an AssessmentSubSection ID
        let actualAssessmentId: string;

        // First, check if it's a sub-section
        const subSection = await queryRunner.manager.findOne(AssessmentSubSection, {
          where: { id: assessmentData.assessmentId },
        });

        if (subSection) {
          // It's a sub-section, use the parent assessment ID
          actualAssessmentId = subSection.assessmentId;
        } else {
          // Check if it's an assessment
          const assessment = await queryRunner.manager.findOne(ExpertAssessment, {
            where: { id: assessmentData.assessmentId },
          });

          if (!assessment) {
            throw new BadRequestException(
              `Assessment or sub-section with ID ${assessmentData.assessmentId} not found`
            );
          }

          actualAssessmentId = assessment.id;
        }

        const submission = this.assessmentSubmissionRepository.create({
          assessmentId: actualAssessmentId,
          score: assessmentData.score,
          remarks: assessmentData.remarks,
          inspectionReportId: savedReport.id,
          warehouseOperatorApplicationId: createInspectionReportDto.warehouseOperatorApplicationId,
          warehouseLocationId: createInspectionReportDto.warehouseLocationId,
        });

        const savedSubmission = await queryRunner.manager.save(AssessmentSubmission, submission);
        submissionMap.set(assessmentData.assessmentId, savedSubmission);
      }

      // Step 4: Upload Files and Create Documents
      // Files are sent in order matching assessments array
      if (files && files.length > 0) {
        for (let i = 0; i < files.length && i < assessments.length; i++) {
          const file = files[i];
          const assessmentData = assessments[i];
          const submission = submissionMap.get(assessmentData.assessmentId);

          if (!submission) {
            throw new BadRequestException(`Submission not found for assessment ${assessmentData.assessmentId}`);
          }

          if (!file) {
            continue; // Skip if file is missing
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

          // Generate unique filename
          const sanitizedFilename = `${uuidv4()}${fileExtension}`;
          const filePath = path.join(this.uploadDir, sanitizedFilename);
          const documentPath = `/uploads/assessment-documents/${sanitizedFilename}`;

          // Save file to disk
          await fs.writeFile(filePath, file.buffer);

          // Create document record
          const document = this.assessmentDocumentRepository.create({
            submissionId: submission.id,
            fileName: file.originalname,
            filePath: documentPath,
            fileType: file.mimetype || 'application/octet-stream',
            fileSize: file.size,
            documentType: 'supporting_document',
            uploadedBy: userId,
          });

          await queryRunner.manager.save(AssessmentDocument, document);
        }
      }

      // Step 4: Check if this is the 6th inspection report for this application+location
      // const reportCount = await queryRunner.manager.count(InspectionReport, {
      //   where: {
      //     warehouseOperatorApplicationId: createInspectionReportDto.warehouseOperatorApplicationId,
      //     warehouseLocationId: createInspectionReportDto.warehouseLocationId,
      //   },
      // });

      // if (reportCount === 6) {
      //   // Find user with WAREHOUSE_OPERATOR_REVIEW permission
      //   const reviewerUser = await queryRunner.manager
      //     .getRepository(User)
      //     .createQueryBuilder('user')
      //     .innerJoin('user.userRoles', 'ur')
      //     .innerJoin('ur.role', 'role')
      //     .innerJoin('role.rolePermissions', 'rp')
      //     .innerJoin('rp.permission', 'permission')
      //     .where('permission.name = :permName', { permName: Permissions.WAREHOUSE_OPERATOR_REVIEW })
      //     .getOne();

      //   if (reviewerUser) {
      //     const review = queryRunner.manager.create(ReviewEntity, {
      //       applicationId: createInspectionReportDto.warehouseOperatorApplicationId,
      //       applicationLocationId: createInspectionReportDto.warehouseLocationId,
      //       userId: userId,
      //       type: 'HOD',
      //       createdAt: new Date(),
      //     });

      //     await queryRunner.manager.save(ReviewEntity, review);
      //   }
      // }

      // Step 5: Create Assignment

      const hodAssignment = await queryRunner.manager.findOne(Assignment, {
        where: {
          applicationId: createInspectionReportDto.warehouseOperatorApplicationId,
          applicationLocationId: createInspectionReportDto.warehouseLocationId,
          level: AssignmentLevel.HOD_TO_EXPERT,
          status: AssignmentStatus.ASSIGNED,
          assignedTo: userId,
        }
      })

      if (!hodAssignment) {
        throw new NotFoundException('HOD assignment not found');
      }

      const assignment = await queryRunner.manager.create(Assignment, {
        assessmentId: savedReport.id,
        level: AssignmentLevel.EXPERT_TO_HOD,
        status: AssignmentStatus.ASSIGNED,
        applicationId: createInspectionReportDto.warehouseOperatorApplicationId,
        applicationLocationId: createInspectionReportDto.warehouseLocationId,
        assignedBy: userId,
        assignedTo: hodAssignment.assignedBy,
        parentAssignmentId: hodAssignment.id,
      });
      await queryRunner.manager.save(Assignment, assignment);

      await queryRunner.commitTransaction();

      // Return report with relations
      const report = await this.inspectionReportRepository.findOne({
        where: { id: savedReport.id },
        relations: ['assessmentSubmissions', 'assessmentSubmissions.documents', 'documents'],
      });

      if (!report) {
        throw new NotFoundException(`Inspection report with ID ${savedReport.id} not found`);
      }

      return report;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<InspectionReport[]> {
    return await this.inspectionReportRepository.find({
      relations: ['createdByUser', 'warehouseOperatorApplication', 'warehouseLocation', 'assessmentSubmissions', 'assessmentSubmissions.documents', 'documents'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByAssessmentType(assessmentType: AssessmentCategory): Promise<InspectionReport[]> {
    return await this.inspectionReportRepository.find({
      where: { assessmentType },
      relations: ['createdByUser', 'warehouseOperatorApplication', 'warehouseLocation', 'assessmentSubmissions', 'assessmentSubmissions.documents', 'documents'],
    });
  }

  async findOne(id: string): Promise<InspectionReport> {
    const report = await this.inspectionReportRepository.findOne({
      where: { id },
      relations: ['createdByUser', 'warehouseOperatorApplication', 'warehouseLocation', 'assessmentSubmissions', 'assessmentSubmissions.documents', 'documents'],
    });

    if (!report) {
      throw new NotFoundException(`Inspection report with ID ${id} not found`);
    }

    return report;
  }

  async update(id: string, updateInspectionReportDto: UpdateInspectionReportDto): Promise<InspectionReport> {
    const report = await this.findOne(id);

    Object.assign(report, updateInspectionReportDto);

    return await this.inspectionReportRepository.save(report);
  }

  async remove(id: string): Promise<void> {
    const report = await this.findOne(id);
    await this.inspectionReportRepository.remove(report);
  }

  async findByApplicationId(applicationId: string): Promise<InspectionReport[]> {
    const report = await this.inspectionReportRepository.find({
      where: [
        { warehouseOperatorApplicationId: applicationId },
        { warehouseLocationId: applicationId }
      ],
      relations: ['createdByUser', 'assessmentSubmissions', 'assessmentSubmissions.documents'],
      select: {
        id: true,
        assessmentType: true,
        maximumScore: true,
        obtainedScore: true,
        percentage: true,
        grade: true,
        selectedGrade: true,
        createdByUser: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    });

    if (!report || report.length === 0) {
      throw new NotFoundException(`Inspection report with application ID ${applicationId} not found`);
    }

    return report;
  }

  async findByApplicationIdAssessment(applicationId: string, userId: string): Promise<InspectionReport> {
    // get user with permission
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role', 'userRoles.role.rolePermissions', 'userRoles.role.rolePermissions.permission'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const isHod = user.userRoles.some(role => role.role.rolePermissions.some(permission => permission.permission.name === Permissions.IS_HOD));
    let assessmentId: string | undefined;
    let assignment: Assignment | null = null;

    if (isHod) {
      assignment = await this.dataSource.getRepository(Assignment).findOne({
        where: [
          {
            applicationId: applicationId,
            assignedTo: userId,
            level: AssignmentLevel.EXPERT_TO_HOD
          },
          {
            applicationLocationId: applicationId,
            assignedTo: userId,
            level: AssignmentLevel.EXPERT_TO_HOD
          }
        ],
      });
      if (assignment) {
        assessmentId = assignment.assessmentId;
      }
    }

    // conditional where statement
    const report = await this.inspectionReportRepository.findOne({
      where: [
        {
          warehouseOperatorApplicationId: applicationId,
          ...(assessmentId ? { id: assessmentId, createdBy: assignment?.assignedBy } : { createdBy: userId }),
        },
        {
          warehouseLocationId: applicationId,
          ...(assessmentId ? { id: assessmentId, createdBy: assignment?.assignedBy } : { createdBy: userId }),
        }
      ],
      relations: ['assessmentSubmissions', 'assessmentSubmissions.documents', 'documents'],
    });

    if (!report) {
      throw new NotFoundException(`Inspection report with application ID ${applicationId} and user ID ${userId} not found`);
    }

    return report;
  }

  async approveOrReject(id: string, approveOrRejectInspectionReportDto: ApproveOrRejectInspectionReportDto, userId: string): Promise<InspectionReport | InspectionReportHistory> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const report = await this.findOne(id);
      if (!report) {
        throw new NotFoundException(`Inspection report not found`);
      }

      const isLocationReport = report.warehouseLocationId !== null;

      if (report.status === InspectionReportStatus.APPROVED || report.status === InspectionReportStatus.REJECTED) {
        throw new BadRequestException('Inspection report is already approved or rejected');
      }

      // Reject inspection report
      if (approveOrRejectInspectionReportDto.status === ApproveOrRejectInspectionReportStatus.REJECTED) {
        // start transaction
        const reportHistoryRepo = queryRunner.manager.getRepository(InspectionReportHistory);
        const submissionHistoryRepo = queryRunner.manager.getRepository(AssessmentSubmissionHistory);

        const historyRecord = reportHistoryRepo.create({
          inspectionReportId: report.id,
          assessmentType: report.assessmentType,
          maximumScore: report.maximumScore,
          obtainedScore: report.obtainedScore,
          percentage: report.percentage,
          grade: report.grade,
          selectedGrade: report.selectedGrade,
          assessmentGradingRemarks: report.assessmentGradingRemarks,
          overallComments: report.overallComments,
          warehouseOperatorApplicationId: report.warehouseOperatorApplicationId,
          warehouseLocationId: report.warehouseLocationId,
          remarks: report.remarks,
          approvedBy: userId,
          approvedAt: new Date(),
          createdBy: report.createdBy,
          status: InspectionReportStatus.REJECTED,
        });
        historyRecord.createdAt = report.createdAt;

        const savedHistoryRecord = await queryRunner.manager.save(InspectionReportHistory, historyRecord);

        if (report.assessmentSubmissions && report.assessmentSubmissions.length > 0) {
          for (const submission of report.assessmentSubmissions) {
            const submissionHistory = submissionHistoryRepo.create({
              assessmentId: submission.assessmentId,
              score: submission.score,
              remarks: submission.remarks,
              status: submission.status,
              warehouseOperatorApplicationId: submission.warehouseOperatorApplicationId,
              warehouseLocationId: submission.warehouseLocationId,
              inspectionReportHistoryId: savedHistoryRecord.id,
            });
            submissionHistory.createdAt = submission.createdAt; // Preserve original timestamp

            const savedSubmissionHistory = await queryRunner.manager.save(AssessmentSubmissionHistory, submissionHistory);

            // Step 3: Copy documents from this submission
            if (submission.documents && submission.documents.length > 0) {
              for (const document of submission.documents) {
                // Update existing document to link to history
                await queryRunner.manager
                  .createQueryBuilder()
                  .update(AssessmentDocument)
                  .set({
                    submissionHistoryId: savedSubmissionHistory.id,
                    inspectionReportHistoryId: savedHistoryRecord.id,
                    submissionId: null as any,
                    inspectionReportId: null as any,
                  })
                  .where('id = :id', { id: document.id })
                  .execute();
              }
            }
          }

        }

        if (report.documents && report.documents.length > 0) {
          for (const document of report.documents) {
            // Update existing document to link to history
            await queryRunner.manager
              .createQueryBuilder()
              .update(AssessmentDocument)
              .set({
                inspectionReportHistoryId: savedHistoryRecord.id,
                inspectionReportId: null as any,
                submissionHistoryId: null as any,
                submissionId: null as any,
              })
              .where('id = :id', { id: document.id })
              .execute();
          }
        }

        // delete Inspection Report & Assessment Submission
        await queryRunner.manager.delete(InspectionReport, { id: report.id });
        await queryRunner.manager.delete(AssessmentSubmission, { inspectionReportId: report.id });

        // get assignment
        const assignment = await queryRunner.manager.findOne(Assignment, {
          where: {
            ...(isLocationReport ? 
              { applicationLocationId: report.warehouseLocationId } : 
              { applicationId: report.warehouseOperatorApplicationId }),
            assignedBy: userId,
            level: AssignmentLevel.HOD_TO_EXPERT,
            status: AssignmentStatus.ASSIGNED,
          },
        });
        if (assignment) {
          // delete assignment HOD_TO_EXPERT
          
          await queryRunner.manager.delete(Assignment, {
            id: assignment.id,
          });
        }
        const childAssignment = await queryRunner.manager.findOne(Assignment, {
          where: {
            ...(isLocationReport ? 
              { applicationLocationId: report.warehouseLocationId } : 
              { applicationId: report.warehouseOperatorApplicationId }),
            assignedTo: userId,
            level: AssignmentLevel.EXPERT_TO_HOD,
            status: AssignmentStatus.ASSIGNED,
          },
        });
        if (childAssignment) {
          // delete child assignment EXPERT_TO_HOD
          await queryRunner.manager.delete(Assignment, {
            id: childAssignment.id,
          });
        }

        await queryRunner.commitTransaction();
        return savedHistoryRecord; // Return history record, not deleted report
      } else {

        // Update report status
        report.status = approveOrRejectInspectionReportDto.status as unknown as InspectionReportStatus;
        report.approvedBy = userId;
        report.approvedAt = new Date();
        report.remarks = approveOrRejectInspectionReportDto.remarks;

        const savedReport = await queryRunner.manager.save(InspectionReport, report);

        // Check if this is the 6th approved/rejected inspection report
        const completedReportsCount = await queryRunner.manager.count(InspectionReport, {
          where: {
            warehouseOperatorApplicationId: report.warehouseOperatorApplicationId,
            warehouseLocationId: report.warehouseLocationId,
            status: In([InspectionReportStatus.APPROVED]),
          },
        });

        // If 6 inspection reports are completed (approved), create a ReviewEntity
        if (completedReportsCount === 6) {
          // Check if review entry already exists for this application+location
          const existingReview = await queryRunner.manager.findOne(ReviewEntity, {
            where: {
              applicationId: report.warehouseOperatorApplicationId,
              applicationLocationId: report.warehouseLocationId,
            },
          });

          if (!existingReview) {
            // Find user with WAREHOUSE_OPERATOR_REVIEW permission
            const reviewerUser = await queryRunner.manager
              .getRepository(User)
              .createQueryBuilder('user')
              .innerJoin('user.userRoles', 'ur')
              .innerJoin('ur.role', 'role')
              .innerJoin('role.rolePermissions', 'rp')
              .innerJoin('rp.permission', 'permission')
              .where('permission.name = :permName', { permName: Permissions.WAREHOUSE_OPERATOR_REVIEW })
              .getOne();

            // Create review entry (userId is nullable, so it's ok if no reviewer found)
            const reviewData: any = {
              applicationId: report.warehouseOperatorApplicationId,
              type: 'HOD',
              isSubmitted: true,
              submittedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // Only add applicationLocationId if it exists
            if (report.warehouseLocationId) {
              reviewData.applicationLocationId = report.warehouseLocationId;
            }

            // Only add userId if reviewer found
            if (reviewerUser?.id) {
              reviewData.userId = reviewerUser.id;
            }

            const review = queryRunner.manager.create(ReviewEntity, reviewData);
            await queryRunner.manager.save(ReviewEntity, review);
          }
        }

        await queryRunner.commitTransaction();
        return savedReport; // Return saved report
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}