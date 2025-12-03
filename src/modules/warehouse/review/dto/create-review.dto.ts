import { IsEnum, IsNotEmpty, IsNumber, IsString, IsUUID, Max, Min } from "class-validator";
import { AssessmentDecision } from "../entities/assessment_details.entity";

export enum ReviewType {
  HR = 'HR',
  FINANCIAL = 'FINANCIAL',
  LEGAL = 'LEGAL',
  SECURITY = 'SECURITY',
  TECHNICAL = 'TECHNICAL',
  ECG = 'ECG',
}

export class CreateReviewDto {
  @IsEnum(ReviewType)
  @IsNotEmpty()
  type: ReviewType;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  score: number;

  @IsString()
  @IsNotEmpty()
  remarks: string;

  @IsEnum(AssessmentDecision)
  @IsNotEmpty()
  decision: AssessmentDecision;

  @IsUUID()
  @IsNotEmpty()
  assessmentSubmissionId: string;
}
