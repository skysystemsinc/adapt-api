import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleRequest } from './role-request.entity';

export enum RolePermissionAction {
  CREATE = 'create',
  DELETE = 'delete',
  UNCHANGED = 'unchanged',
}

@Entity('role_permissions_requests')
export class RolePermissionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  roleRequestId: string;

  @ManyToOne(() => RoleRequest, (roleRequest) => roleRequest.permissionRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roleRequestId' })
  roleRequest: RoleRequest;

  @Column({ type: 'uuid' })
  permissionId: string;

  @Column({ type: 'uuid', nullable: true })
  originalRolePermissionId: string | null;

  @Column({ type: 'varchar', default: RolePermissionAction.UNCHANGED })
  action: RolePermissionAction;

  @Column({ nullable: true })
  version: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

