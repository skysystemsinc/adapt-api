import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SettingRequestStatus } from '../entities/setting-request.entity';

export class ReviewSettingRequestDto {
  @ApiProperty({
    description: 'Review decision',
    enum: SettingRequestStatus,
    example: SettingRequestStatus.APPROVED,
  })
  @IsEnum(SettingRequestStatus)
  @IsNotEmpty()
  status: SettingRequestStatus.APPROVED | SettingRequestStatus.REJECTED;

  @ApiProperty({
    description: 'Review notes (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  reviewNotes?: string;
}
