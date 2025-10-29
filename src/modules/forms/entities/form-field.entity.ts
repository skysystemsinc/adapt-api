import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Form } from '../../forms/entities/form.entity';

@Entity('form_fields')
export class FormField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  formId: string;

  @ManyToOne(() => Form, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formId' })
  form: Form;

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
  isSingle: boolean; // For checkbox: true = single (boolean), false = multiple options

  @Column({ nullable: true })
  placeholder: string;

  @Column({ type: 'jsonb', nullable: true })
  validation: any; // Validation rules (min, max, pattern, etc.)

  @Column({ type: 'jsonb', nullable: true })
  conditions: any; // Conditional visibility rules

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'int' })
  step: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Additional metadata (e.g., step title for first field in step)

  @Column({ type: 'varchar', default: 'full' })
  width: string; // 'full' or 'half' - controls field width in the form

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

