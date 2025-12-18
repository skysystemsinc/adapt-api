import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { InspectionReportRequestStatus } from '../entities/inspection-report-request.entity';

export class ReviewInspectionReportRequestDto {
  @ApiProperty({
    description: 'Review decision',
    enum: InspectionReportRequestStatus,
    example: InspectionReportRequestStatus.APPROVED,
  })
  @IsEnum(InspectionReportRequestStatus)
  @IsNotEmpty()
  status: InspectionReportRequestStatus.APPROVED | InspectionReportRequestStatus.REJECTED;

  @ApiProperty({
    description: 'Review notes (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  reviewNotes?: string;
}

