import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean, IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRequestAction } from '../entities/user-request.entity';

export class CreateUserRequestDto {
  @ApiProperty({ description: 'User ID this request is for (null for new user creation)', required: false })
  @IsUUID('4')
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: 'Action: create, update, or delete', enum: UserRequestAction, required: false })
  @IsEnum(UserRequestAction)
  @IsOptional()
  action?: UserRequestAction;

  @ApiProperty({ description: 'User email (required for CREATE; optional for UPDATE)', required: false })
  @IsEmail()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  email?: string;

  @ApiProperty({ description: 'First name', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  firstName?: string;

  @ApiProperty({ description: 'Last name', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  lastName?: string;

  @ApiProperty({ description: 'Role ID', required: false })
  @IsUUID('4')
  @IsOptional()
  roleId?: string;

  @ApiProperty({ description: 'Organization ID', required: false })
  @IsUUID('4')
  @IsOptional()
  organizationId?: string | null;

  @ApiProperty({ description: 'Active status', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
