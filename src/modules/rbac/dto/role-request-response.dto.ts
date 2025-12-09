import { Expose } from 'class-transformer';
import { RoleRequestStatus, RoleRequestAction } from '../entities/role-request.entity';

export class RolePermissionRequestResponseDto {
  @Expose()
  id: string;

  @Expose()
  roleRequestId: string;

  @Expose()
  permissionId: string;

  @Expose()
  permissionName?: string;

  @Expose()
  originalRolePermissionId?: string;

  @Expose()
  action: string;

  @Expose()
  version?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

export class RoleRequestResponseDto {
  @Expose()
  id: string;

  @Expose()
  roleId: string;

  @Expose()
  name: string;

  @Expose()
  description?: string;

  @Expose()
  status: RoleRequestStatus;

  @Expose()
  action: RoleRequestAction;

  @Expose()
  version?: string;

  @Expose()
  requestedBy?: string;

  @Expose()
  reviewedBy?: string;

  @Expose()
  reviewedAt?: Date;

  @Expose()
  reviewNotes?: string;

  @Expose()
  permissions: RolePermissionRequestResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

