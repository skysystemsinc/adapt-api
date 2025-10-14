import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

export enum FormStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity('forms')
export class Form {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  schema: any; // Stores the full form JSON from frontend

  @Column({ default: true })
  isPublic: boolean;

  @Column({
    type: 'enum',
    enum: FormStatus,
    default: FormStatus.PUBLISHED,
  })
  status: FormStatus;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Auto-generate slug from title before insert/update
  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (this.title && !this.slug) {
      this.slug = this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }
}

