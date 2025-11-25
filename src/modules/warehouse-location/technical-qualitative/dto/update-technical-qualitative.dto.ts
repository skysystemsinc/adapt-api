import { PartialType } from '@nestjs/swagger';
import { CreateTechnicalQualitativeDto } from './create-technical-qualitative.dto';

export class UpdateTechnicalQualitativeDto extends PartialType(CreateTechnicalQualitativeDto) {}

