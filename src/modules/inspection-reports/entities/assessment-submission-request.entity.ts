import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InspectionReportRequest } from './inspection-report-request.entity';

@Entity('assessment_submission_requests')
export class AssessmentSubmissionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  inspectionReportRequestId: string;

  @ManyToOne(() => InspectionReportRequest, (request) => request.assessmentRequests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inspectionReportRequestId' })
  inspectionReportRequest: InspectionReportRequest;

  @Column({ type: 'uuid' })
  assessmentId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score?: number;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  // Temporary file path for this assessment's document
  @Column({ type: 'text', nullable: true })
  filePath?: string;

  @Column({ type: 'text', nullable: true })
  fileIv?: string;

  @Column({ type: 'text', nullable: true })
  fileAuthTag?: string;

  @Column({ type: 'text', nullable: true })
  fileMimeType?: string;

  @Column({ type: 'text', nullable: true })
  fileOriginalName?: string;

  // Original snapshot (for updates) stored as JSON
  @Column({ type: 'jsonb', nullable: true })
  originalData?: {
    score?: number;
    remarks?: string;
    filePath?: string;
    fileMimeType?: string;
    fileOriginalName?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
