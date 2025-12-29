import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssessmentCategory } from './expert-assessment.entity';

export enum ExpertAssessmentRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ExpertAssessmentRequestAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

@Entity('expert_assessment_requests')
export class ExpertAssessmentRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  assessmentId: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: AssessmentCategory,
  })
  category: AssessmentCategory;

  @Column({ default: true })
  isActive: boolean;

  // Original values snapshot (for UPDATE/DELETE) - stored as JSON
  @Column({ type: 'jsonb', nullable: true })
  originalData: {
    name?: string;
    category?: AssessmentCategory;
    isActive?: boolean;
  } | null;

  @Column({ type: 'enum', enum: ExpertAssessmentRequestStatus, default: ExpertAssessmentRequestStatus.PENDING })
  status: ExpertAssessmentRequestStatus;

  @Column({ type: 'varchar', default: ExpertAssessmentRequestAction.UPDATE })
  action: ExpertAssessmentRequestAction;

  @Column({ type: 'uuid', nullable: true })
  requestedBy: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
