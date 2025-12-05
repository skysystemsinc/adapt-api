import { IsArray, IsDateString, isEnum, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from "class-validator";
import { AssessmentDecision } from "../entities/assessment_details.entity";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum ReviewType {
    HR = 'HR',
    FINANCIAL = 'FINANCIAL',
    LEGAL = 'LEGAL',
    SECURITY = 'SECURITY',
    TECHNICAL = 'TECHNICAL',
    ECG = 'ECG',
}

class AssessmentReview {
    @ApiProperty({
        description: 'The type of review',
        enum: ReviewType,
        example: ReviewType.HR,
    })
    @IsEnum(ReviewType)
    @IsNotEmpty()
    type: ReviewType;

    @ApiProperty({
        description: 'The score of the review',
        example: 5,
    })
    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    @Max(5)
    score: number;

    @ApiProperty({
        description: 'The remarks of the review',
        example: 'The remarks of the review',
    })
    @IsString()
    @IsNotEmpty()
    remarks: string;

    @ApiProperty({
        description: 'The decision of the review',
        enum: AssessmentDecision,
        example: AssessmentDecision.ACCEPTED,
    })
    @IsEnum(AssessmentDecision)
    @IsNotEmpty()
    decision: AssessmentDecision;

    @ApiProperty({
        description: 'The assessment submission ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsNotEmpty()
    assessmentSubmissionId: string;
}

export class CreateReviewDto {
    @ApiProperty({
        description: 'The assessments of the review. All assessment types (HR, FINANCIAL, LEGAL, SECURITY, TECHNICAL, ECG) must be provided exactly once.',
        type: [AssessmentReview],
        minItems: 6,
        maxItems: 6,
    })
    @IsArray()
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => AssessmentReview)
    assessments: AssessmentReview[];

    @ApiPropertyOptional({
        description: 'Full name of the reviewer',
        example: 'John Doe',
    })
    @IsString()
    @IsOptional()
    fullName?: string;

    @ApiPropertyOptional({
        description: 'Designation of the reviewer',
        example: 'Chief Executive Officer',
    })
    @IsString()
    @IsOptional()
    designation?: string;

    @ApiPropertyOptional({
        description: 'Date of assessment',
        example: '2025-12-05',
    })
    @IsDateString()
    @IsOptional()
    dateOfAssessment?: Date;

    @ApiPropertyOptional({
        description: 'Accreditation grade',
        example: 'A+',
    })
    @IsString()
    @IsOptional()
    accreditationGrade?: string;
}
