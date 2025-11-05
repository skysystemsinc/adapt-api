import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { FormFieldRequest } from './form-field-request.entity';

export enum FormRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('form_requests')
export class FormRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  formId: string; // Reference to the original form

  @Column()
  title: string;

  @Column()
  slug: string; // Should be 'registration-form' for registration forms

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  schema: any;

  @Column({ default: true })
  isPublic: boolean;

  @Column({
    type: 'enum',
    enum: FormRequestStatus,
    default: FormRequestStatus.PENDING,
  })
  status: FormRequestStatus;

  @Column({ nullable: true })
  version: string; // Version that will be applied (v1, v2, etc.)

  @Column({ type: 'uuid', nullable: true })
  requestedBy: string; // User who requested the change

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string; // Super admin who reviewed

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null;

  @OneToMany(() => FormFieldRequest, (fieldRequest) => fieldRequest.formRequest, {
    cascade: true,
  })
  fields: FormFieldRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

