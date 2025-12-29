import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { AssessmentCategory } from '../entities/expert-assessment.entity';
import { ExpertAssessmentRequestAction } from '../entities/expert-assessment-request.entity';

export class CreateExpertAssessmentRequestDto {
  @ApiProperty({ description: 'Assessment ID this request is for (null for new assessment creation)', required: false })
  @IsUUID('4')
  @IsOptional()
  assessmentId?: string;

  @ApiProperty({ description: 'Assessment name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Category of the assessment',
    enum: AssessmentCategory,
  })
  @IsEnum(AssessmentCategory)
  @IsNotEmpty()
  category: AssessmentCategory;

  @ApiProperty({ description: 'Whether the assessment is active', default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Action: create, update, or delete', default: 'update', required: false })
  @IsString()
  @IsOptional()
  action?: ExpertAssessmentRequestAction;
}
