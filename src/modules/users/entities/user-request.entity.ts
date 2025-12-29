import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum UserRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum SuperAdminRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum UserRequestAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

@Entity('user_requests')
export class UserRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastName: string | null;

  @Column({ type: 'uuid', nullable: true })
  roleId: string | null;

  @Column({ type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ type: 'boolean', nullable: true })
  isActive: boolean | null;

  @Column({ type: 'enum', enum: UserRequestStatus, default: UserRequestStatus.PENDING })
  status: UserRequestStatus;

  @Column({ type: 'enum', enum: SuperAdminRequestStatus, nullable: true })
  adminStatus: SuperAdminRequestStatus | null;

  @Column({ type: 'varchar', default: UserRequestAction.UPDATE })
  action: UserRequestAction;

  @Column({ type: 'uuid', nullable: true })
  requestedBy: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null;

  // Snapshot fields for original values (for UPDATE/DELETE)
  @Column({ type: 'varchar', nullable: true })
  originalEmail: string | null;

  @Column({ type: 'varchar', nullable: true })
  originalFirstName: string | null;

  @Column({ type: 'varchar', nullable: true })
  originalLastName: string | null;

  @Column({ type: 'uuid', nullable: true })
  originalRoleId: string | null;

  @Column({ type: 'uuid', nullable: true })
  originalOrganizationId: string | null;

  @Column({ type: 'boolean', nullable: true })
  originalIsActive: boolean | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

