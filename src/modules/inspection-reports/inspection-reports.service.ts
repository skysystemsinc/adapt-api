import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateInspectionReportDto } from './dto/create-inspection-report.dto';
import { UpdateInspectionReportDto } from './dto/update-inspection-report.dto';
import { InspectionReport } from './entities/inspection-report.entity';
import { AssessmentDocument } from '../expert-assessment/assessment-documents/entities/assessment-document.entity';
import { AssessmentSubmission } from '../expert-assessment/assessment-submission/entities/assessment-submission.entity';
import { AssessmentSubSection } from '../expert-assessment/assessment-sub-section/entities/assessment-sub-section.entity';
import { AssessmentCategory, ExpertAssessment } from '../expert-assessment/entities/expert-assessment.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
    private readonly dataSource: DataSource
  ) {}

  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'assessment-documents');

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async create(
    createInspectionReportDto: CreateInspectionReportDto,
    files: any[],
    userId?: string
  ): Promise<InspectionReport> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Ensure upload directory exists
      await this.ensureUploadDirectory();

      // Step 1: Create Inspection Report
      const { assessments, ...reportData } = createInspectionReportDto;
      
      const inspectionReport = this.inspectionReportRepository.create({
        ...reportData,
        createdBy: userId,
      });

      const savedReport = await queryRunner.manager.save(InspectionReport, inspectionReport);

      // Step 2: Create Assessment Submissions
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

      // Step 3: Upload Files and Create Documents
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

      await queryRunner.commitTransaction();

      // Return report with relations
      const report = await this.inspectionReportRepository.findOne({
        where: { id: savedReport.id },
        relations: ['assessmentSubmissions', 'assessmentSubmissions.documents'],
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
      relations: ['createdByUser', 'warehouseOperatorApplication', 'warehouseLocation', 'assessmentSubmissions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByAssessmentType(assessmentType: AssessmentCategory): Promise<InspectionReport[]> {
    return await this.inspectionReportRepository.find({
      where: { assessmentType },
      relations: ['createdByUser', 'warehouseOperatorApplication', 'warehouseLocation', 'assessmentSubmissions', 'assessmentSubmissions.documents'],
    });
  }

  async findOne(id: string): Promise<InspectionReport> {
    const report = await this.inspectionReportRepository.findOne({
      where: { id },
      relations: ['createdByUser', 'warehouseOperatorApplication', 'warehouseLocation', 'assessmentSubmissions'],
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
}