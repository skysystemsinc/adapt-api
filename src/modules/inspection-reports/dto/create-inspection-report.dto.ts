import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, IsArray, ValidateNested } from "class-validator";
import { IsUUID } from "class-validator";
import { Type, Transform } from "class-transformer";
import { CreateAssessmentSubmissionDto } from "../../expert-assessment/assessment-submission/dto/create-assessment-submission.dto";


export class CreateInspectionReportDto {
    @ApiProperty({ description: 'Maximum score', example: '260' })
    @IsString()
    @IsNotEmpty()
    maximumScore: string;

    @ApiProperty({ description: 'Obtained score', example: '235' })
    @IsString()
    @IsNotEmpty()
    obtainedScore: string;

    @ApiProperty({ description: 'Percentage', example: '90.38' })
    @IsString()
    @IsNotEmpty()
    percentage: string;

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
}