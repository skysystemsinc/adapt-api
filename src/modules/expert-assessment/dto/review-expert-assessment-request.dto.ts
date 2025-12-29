import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ExpertAssessmentRequestStatus } from '../entities/expert-assessment-request.entity';

export class ReviewExpertAssessmentRequestDto {
  @ApiProperty({
    description: 'Review decision',
    enum: ExpertAssessmentRequestStatus,
    example: ExpertAssessmentRequestStatus.APPROVED,
  })
  @IsEnum(ExpertAssessmentRequestStatus)
  @IsNotEmpty()
  status: ExpertAssessmentRequestStatus;

  @ApiProperty({
    description: 'Review notes (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  reviewNotes?: string;
}
