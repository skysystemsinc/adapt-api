import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssessmentCategory } from '../entities/expert-assessment.entity';

export class CreateExpertAssessmentDto {
  @ApiProperty({ description: 'Name of the expert assessment', example: 'Financial Audit Assessment' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Category of the assessment',
    enum: AssessmentCategory,
    example: AssessmentCategory.FINANCIAL
  })
  @IsEnum(AssessmentCategory)
  @IsNotEmpty()
  category: AssessmentCategory;

  @ApiProperty({ description: 'Whether the assessment is active', default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
