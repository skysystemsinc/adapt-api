import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';
import { RoleRequestStatus } from '../entities/role-request.entity';

export class ReviewRoleRequestDto {
  @ApiProperty({
    description: 'Review decision',
    enum: RoleRequestStatus,
    example: RoleRequestStatus.APPROVED,
  })
  @IsEnum(RoleRequestStatus)
  @IsNotEmpty()
  status: RoleRequestStatus;

  @ApiProperty({
    description: 'Review notes (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  reviewNotes?: string;

  @ApiProperty({
    description: 'Individual permission decisions (permissionId -> "approved" | "rejected")',
    required: false,
    example: { 'permission-id-1': 'approved', 'permission-id-2': 'rejected' },
  })
  @IsObject()
  @IsOptional()
  permissionDecisions?: Record<string, 'approved' | 'rejected'>;
}

