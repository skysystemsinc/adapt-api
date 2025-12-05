import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('file_uploads')
@Index(['filePath'], { unique: true })
export class FileUpload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  filePath: string; // e.g., "/uploads/uuid.pdf"

  @Column({ type: 'text' })
  iv: string;

  @Column({ type: 'text' })
  authTag: string;

  @Column({ type: 'text', nullable: true })
  originalName?: string;

  @Column({ type: 'text', nullable: true })
  mimeType?: string;

  @Column({ type: 'int', nullable: true })
  size?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

