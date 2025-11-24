import { PartialType } from '@nestjs/swagger';
import { CreateAssessmentSubmissionDto } from './create-assessment-submission.dto';

export class UpdateAssessmentSubmissionDto extends PartialType(CreateAssessmentSubmissionDto) {}
