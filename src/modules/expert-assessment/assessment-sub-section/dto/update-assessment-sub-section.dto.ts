import { PartialType } from '@nestjs/swagger';
import { CreateAssessmentSubSectionDto } from './create-assessment-sub-section.dto';

export class UpdateAssessmentSubSectionDto extends PartialType(CreateAssessmentSubSectionDto) { }
