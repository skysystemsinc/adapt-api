import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AssessmentSubSectionRequestStatus } from '../entities/assessment-sub-section-request.entity';

export class ReviewAssessmentSubSectionRequestDto {
  @ApiProperty({
    description: 'Review decision',
    enum: AssessmentSubSectionRequestStatus,
    example: AssessmentSubSectionRequestStatus.APPROVED,
  })
  @IsEnum(AssessmentSubSectionRequestStatus)
  @IsNotEmpty()
  status: AssessmentSubSectionRequestStatus;

  @ApiProperty({
    description: 'Review notes (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  reviewNotes?: string;
}
