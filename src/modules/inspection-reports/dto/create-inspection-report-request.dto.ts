import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, IsArray, ValidateNested, IsEnum, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CreateAssessmentSubmissionDto } from '../../expert-assessment/assessment-submission/dto/create-assessment-submission.dto';
import { AssessmentCategory } from '../../expert-assessment/entities/expert-assessment.entity';

export class CreateInspectionReportRequestDto {
  @ApiProperty({
    description: 'Assessment type (inspection type)',
    enum: AssessmentCategory,
    example: AssessmentCategory.HR
  })
  @IsEnum(AssessmentCategory)
  @IsNotEmpty()
  assessmentType: AssessmentCategory;

  @ApiProperty({ description: 'Maximum score', example: 260, type: Number })
  @Transform(({ value }) => parseFloat(value) || 0)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  maximumScore: number;

  @ApiProperty({ description: 'Obtained score', example: 235, type: Number })
  @Transform(({ value }) => parseFloat(value) || 0)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  obtainedScore: number;

  @ApiProperty({ description: 'Percentage', example: 90.38, type: Number })
  @Transform(({ value }) => parseFloat(value) || 0)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiProperty({ description: 'Grade', example: 'A+' })
  @IsString()
  @IsNotEmpty()
  grade: string;

  @ApiProperty({ description: 'Selected grade (1-5)', example: 1, minimum: 1, maximum: 5 })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      return isNaN(num) ? value : num;
    }
    return value;
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  selectedGrade: number;

  @ApiProperty({ description: 'Assessment grading remarks' })
  @IsString()
  @IsNotEmpty()
  assessmentGradingRemarks: string;

  @ApiProperty({ description: 'Overall comments and recommendations' })
  @IsString()
  @IsNotEmpty()
  overallComments: string;

  @ApiProperty({
    description: 'Array of assessment submissions',
    type: [CreateAssessmentSubmissionDto]
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssessmentSubmissionDto)
  assessments: CreateAssessmentSubmissionDto[];

  @ApiPropertyOptional({ description: 'Warehouse operator application ID' })
  @IsUUID()
  @IsOptional()
  warehouseOperatorApplicationId?: string;

  @ApiPropertyOptional({ description: 'Warehouse location ID' })
  @IsUUID()
  @IsOptional()
  warehouseLocationId?: string;

  @ApiPropertyOptional({ description: 'Inspection report ID (for updates)' })
  @IsUUID()
  @IsOptional()
  inspectionReportId?: string;
}

