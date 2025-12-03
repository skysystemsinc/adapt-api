import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ReviewEntity } from "./review.entity";
import { AssessmentSubmission } from "../../../expert-assessment/assessment-submission/entities/assessment-submission.entity";

export enum AssessmentDecision {
  RECONSIDERATION = 'RECONSIDERATION',
  ACCEPTED = 'ACCEPTED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  CONDITIONAL_ACCEPTED = 'CONDITIONAL_ACCEPTED',
  NEED_IMPROVEMENT = 'NEED_IMPROVEMENT',
  DOWN_RATE = 'DOWN_RATE',
  UP_RATE = 'UP_RATE',
}

@Entity('warehouse_final_assessment_details')
export class AssessmentDetailsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  assessmentId: string;

  @ManyToOne(() => ReviewEntity, (assessment) => assessment.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessmentId' })
  assessment: ReviewEntity;

  @Column({ type: 'uuid', nullable: true })
  submissionId: string;

  @ManyToOne(() => AssessmentSubmission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submissionId' })
  assessmentSubmission: AssessmentSubmission;

  @Column({ type: 'varchar', length: 100, nullable: true })
  type: string;

  @Column({ type: 'enum', enum: AssessmentDecision, nullable: true })
  decision: AssessmentDecision;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  score: number;

  @Column({ type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}
