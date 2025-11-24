import { PartialType } from '@nestjs/swagger';
import { CreateAcademicQualificationDto } from './create-academic-qualification.dto';

export class UpdateAcademicQualificationDto extends PartialType(CreateAcademicQualificationDto) {}
