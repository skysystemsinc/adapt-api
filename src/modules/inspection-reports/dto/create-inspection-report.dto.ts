import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, IsArray, ValidateNested, IsEnum } from "class-validator";
import { IsUUID } from "class-validator";
import { Type, Transform } from "class-transformer";
import { CreateAssessmentSubmissionDto } from "../../expert-assessment/assessment-submission/dto/create-assessment-submission.dto";
import { AssessmentCategory } from "../../expert-assessment/entities/expert-assessment.entity";


export class CreateInspectionReportDto {
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

  // Assessment Grading
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

  // Evaluation Summary
  @ApiProperty({ description: 'Overall comments and recommendations' })
  @IsString()
  @IsNotEmpty()
  overallComments: string;

  // Assessments Array
  @ApiProperty({
    description: 'Array of assessment submissions',
    type: [CreateAssessmentSubmissionDto]
  })
  @Transform(({ value }) => {
    // If value is a string (from FormData), parse it as JSON
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    // If already an array, return as is
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssessmentSubmissionDto)
  assessments: CreateAssessmentSubmissionDto[];

  // Relationships (optional)
  @ApiPropertyOptional({ description: 'Warehouse operator application ID' })
  @IsUUID()
  @IsOptional()
  warehouseOperatorApplicationId?: string;

  @ApiPropertyOptional({ description: 'Warehouse location ID' })
  @IsUUID()
  @IsOptional()
  warehouseLocationId?: string;

  // Files as base64 strings
  @ApiPropertyOptional({
    description: 'Array of base64-encoded files for assessments (one per assessment)',
    type: [String],
    example: ['data:application/pdf;base64,JVBERi0xLjQK...']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[];

  @ApiPropertyOptional({
    description: 'Array of filenames for assessment files (required if files contains base64)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileNames?: string[];

  @ApiPropertyOptional({
    description: 'Array of MIME types for assessment files (required if files contains base64)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileMimeTypes?: string[];

  @ApiProperty({
    description: 'Global document as base64-encoded string (required)',
    example: 'data:application/pdf;base64,JVBERi0xLjQK...'
  })
  @IsNotEmpty()
  @IsString()
  globalDocument: string;

  @ApiProperty({
    description: 'Original filename for global document (required if globalDocument is base64)',
  })
  @IsNotEmpty()
  @IsString()
  globalDocumentFileName: string;

  @ApiPropertyOptional({
    description: 'MIME type for global document (required if globalDocument is base64)',
  })
  @IsOptional()
  @IsString()
  globalDocumentMimeType?: string;
}