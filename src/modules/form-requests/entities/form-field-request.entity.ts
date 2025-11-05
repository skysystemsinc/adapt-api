import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FormRequest } from './form-request.entity';

export enum FieldAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UNCHANGED = 'unchanged', // Field that is cloned without changes
}

@Entity('form_fields_requests')
export class FormFieldRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  formRequestId: string;

  @ManyToOne(() => FormRequest, (formRequest) => formRequest.fields, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'formRequestId' })
  formRequest: FormRequest;

  @Column()
  fieldKey: string;

  @Column({ nullable: true })
  label: string;

  @Column({ nullable: true })
  title: string; // For heading fields

  @Column()
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  options: any;

  @Column({ default: false })
  required: boolean;

  @Column({ default: false })
  isSingle: boolean;

  @Column({ nullable: true })
  placeholder: string;

  @Column({ type: 'jsonb', nullable: true })
  validation: any;

  @Column({ type: 'jsonb', nullable: true })
  conditions: any;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'int' })
  step: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'varchar', default: 'full' })
  width: string;

  @Column({ default: false })
  includeInKycVerification: boolean;

  @Column({ nullable: true })
  version: string; // Version marker (v1, v2, etc.)

  @Column({ type: 'uuid', nullable: true })
  originalFieldId: string; // ID of the original field (if updating/deleting)

  @Column({
    type: 'varchar',
    default: FieldAction.UPDATE,
  })
  action: FieldAction; // 'create', 'update', or 'delete'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

