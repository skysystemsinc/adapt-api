import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRolePermissionRequestDto {
  @ApiProperty({ description: 'Permission ID (UUID)' })
  @IsUUID('4')
  @IsNotEmpty()
  permissionId: string;

  @ApiProperty({ description: 'Action: create, delete, or unchanged', default: 'unchanged' })
  @IsString()
  @IsOptional()
  action?: 'create' | 'delete' | 'unchanged';

  @ApiProperty({ description: 'Original role permission ID (if updating/deleting)', required: false })
  @IsUUID('4')
  @IsOptional()
  originalRolePermissionId?: string;
}

export class CreateRoleRequestDto {
  @ApiProperty({ description: 'Role ID this request is for (null for new role creation)', required: false })
  @IsUUID('4')
  @IsOptional()
  roleId?: string;

  @ApiProperty({ description: 'Role name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Role description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Role permissions', type: [CreateRolePermissionRequestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRolePermissionRequestDto)
  permissions: CreateRolePermissionRequestDto[];
}

