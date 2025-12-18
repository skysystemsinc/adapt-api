import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AssessmentCategory } from '../../expert-assessment/entities/expert-assessment.entity';
import { AssessmentSubmissionRequest } from './assessment-submission-request.entity';

export enum InspectionReportRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('inspection_report_requests')
export class InspectionReportRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  inspectionReportId: string | null;

  @Column({
    type: 'enum',
    enum: AssessmentCategory,
  })
  assessmentType: AssessmentCategory;

  // Overall Inspection Findings
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  maximumScore: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  obtainedScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  percentage: number;

  @Column({ type: 'varchar', length: 10 })
  grade: string;

  // Assessment Grading
  @Column({ type: 'int' })
  selectedGrade: number;

  @Column({ type: 'text' })
  assessmentGradingRemarks: string;

  // Evaluation Summary
  @Column({ type: 'text' })
  overallComments: string;

  // Relationships
  @Column({ type: 'uuid', nullable: true })
  warehouseOperatorApplicationId?: string;

  @Column({ type: 'uuid', nullable: true })
  warehouseLocationId?: string;

  // Global document path (temporary for request)
  @Column({ type: 'text', nullable: true })
  globalDocumentPath?: string;

  @Column({ type: 'text', nullable: true })
  globalDocumentIv?: string;

  @Column({ type: 'text', nullable: true })
  globalDocumentAuthTag?: string;

  @Column({ type: 'text', nullable: true })
  globalDocumentMimeType?: string;

  @Column({ type: 'text', nullable: true })
  globalDocumentOriginalName?: string;

  // Request status and review fields
  @Column({ type: 'enum', enum: InspectionReportRequestStatus, default: InspectionReportRequestStatus.PENDING })
  status: InspectionReportRequestStatus;

  @Column({ type: 'uuid', nullable: true })
  requestedBy: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null;

  // Original snapshot (for updates - if updating existing report) stored as JSON
  @Column({ type: 'jsonb', nullable: true })
  originalData?: {
    maximumScore?: number;
    obtainedScore?: number;
    percentage?: number;
    grade?: string;
    selectedGrade?: number;
    assessmentGradingRemarks?: string;
    overallComments?: string;
    globalDocumentPath?: string;
    globalDocumentMimeType?: string;
    globalDocumentOriginalName?: string;
  };

  @OneToMany(() => AssessmentSubmissionRequest, (assessmentRequest) => assessmentRequest.inspectionReportRequest, { cascade: true })
  assessmentRequests: AssessmentSubmissionRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

