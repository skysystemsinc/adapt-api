import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class AssignPermissionsToRoleDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

