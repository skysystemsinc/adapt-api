import { PartialType } from '@nestjs/swagger';
import { CreateExpertAssessmentDto } from './create-expert-assessment.dto';

export class UpdateExpertAssessmentDto extends PartialType(CreateExpertAssessmentDto) {}
