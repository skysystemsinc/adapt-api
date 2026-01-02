import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { SettingRequestAction } from '../entities/setting-request.entity';

export class CreateSettingRequestDto {
  @ApiProperty({ description: 'Setting ID this request is for (null for new setting creation)', required: false })
  @IsUUID('4')
  @IsOptional()
  settingId?: string;

  @ApiProperty({ description: 'Setting key (required for CREATE, optional for UPDATE)', required: false })
  @IsString()
  @IsOptional()
  key?: string;

  @ApiProperty({ 
    description: 'Setting value (required for CREATE/UPDATE, optional for DELETE). For file settings, this should be a base64-encoded string.', 
    required: false 
  })
  @IsString()
  @IsOptional()
  value?: string;

  @ApiProperty({ description: 'MIME type for file settings', required: false })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiProperty({ description: 'Original filename for file settings', required: false })
  @IsString()
  @IsOptional()
  originalName?: string;

  @ApiProperty({ description: 'Initialization vector (IV) for encrypted file settings', required: false })
  @IsString()
  @IsOptional()
  iv?: string;

  @ApiProperty({ description: 'Authentication tag for encrypted file settings', required: false })
  @IsString()
  @IsOptional()
  authTag?: string;

  @ApiProperty({ description: 'Action: create, update, or delete', enum: SettingRequestAction, required: false })
  @IsEnum(SettingRequestAction)
  @IsOptional()
  action?: SettingRequestAction;

  @ApiProperty({ description: 'Whether the value is encrypted (for file/secret settings)', required: false })
  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;
}
