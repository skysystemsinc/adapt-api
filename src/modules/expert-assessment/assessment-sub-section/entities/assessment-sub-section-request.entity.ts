import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AssessmentSubSectionRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum AssessmentSubSectionRequestAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

@Entity('assessment_sub_section_requests')
export class AssessmentSubSectionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  subSectionId: string | null;

  @Column({ type: 'uuid' })
  assessmentId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ default: true })
  isActive: boolean;

  // Original values snapshot (for UPDATE/DELETE) - stored as JSON
  @Column({ type: 'jsonb', nullable: true })
  originalData: {
    name?: string;
    order?: number;
    isActive?: boolean;
  } | null;

  @Column({ type: 'enum', enum: AssessmentSubSectionRequestStatus, default: AssessmentSubSectionRequestStatus.PENDING })
  status: AssessmentSubSectionRequestStatus;

  @Column({ type: 'varchar', default: AssessmentSubSectionRequestAction.UPDATE })
  action: AssessmentSubSectionRequestAction;

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
