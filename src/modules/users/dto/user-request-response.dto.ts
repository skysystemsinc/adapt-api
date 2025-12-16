import { Expose } from 'class-transformer';
import { UserRequestStatus, UserRequestAction } from '../entities/user-request.entity';

export class UserRequestResponseDto {
  @Expose()
  id: string;

  @Expose()
  userId: string | null;

  @Expose()
  email: string | null;

  @Expose()
  firstName: string | null;

  @Expose()
  lastName: string | null;

  @Expose()
  roleId: string | null;

  @Expose()
  organizationId: string | null;

  @Expose()
  isActive: boolean | null;

  @Expose()
  status: UserRequestStatus;

  @Expose()
  action: UserRequestAction;

  @Expose()
  requestedBy?: string | null;

  @Expose()
  reviewedBy?: string | null;

  @Expose()
  reviewedAt?: Date | null;

  @Expose()
  reviewNotes?: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // Snapshot fields for original values
  @Expose()
  originalEmail?: string | null;

  @Expose()
  originalFirstName?: string | null;

  @Expose()
  originalLastName?: string | null;

  @Expose()
  originalRoleId?: string | null;

  @Expose()
  originalOrganizationId?: string | null;

  @Expose()
  originalIsActive?: boolean | null;

  // Role and organization names (populated by service)
  @Expose()
  roleName?: string | null;

  @Expose()
  originalRoleName?: string | null;

  @Expose()
  organizationName?: string | null;

  @Expose()
  originalOrganizationName?: string | null;
}
