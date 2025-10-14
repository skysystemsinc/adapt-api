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

  @Column()
  label: string;

  @Column()
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  options: any;

  @Column({ default: false })
  required: boolean;

  @Column({ default: false })
  isSingle: boolean; // For checkbox: true = single (boolean), false = multiple options

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'int' })
  step: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

