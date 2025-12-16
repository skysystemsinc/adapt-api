import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SettingRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum SettingRequestAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

@Entity('setting_requests')
export class SettingRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  settingId: string | null;

  @Column()
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'text', nullable: true })
  iv?: string;

  @Column({ type: 'text', nullable: true })
  authTag?: string;

  @Column({ type: 'text', nullable: true })
  mimeType?: string;

  @Column({ type: 'text', nullable: true })
  originalName?: string;

  @Column({ type: 'enum', enum: SettingRequestStatus, default: SettingRequestStatus.PENDING })
  status: SettingRequestStatus;

  @Column({ type: 'varchar', default: SettingRequestAction.UPDATE })
  action: SettingRequestAction;

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
