import { PermissionResponseDto } from './permission-response.dto';

export class RoleResponseDto {
  id: string;
  name: string;
  description?: string;
  permissions?: PermissionResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

