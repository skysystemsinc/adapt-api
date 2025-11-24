import { PartialType } from '@nestjs/swagger';
import { CreateProfessionalQualificationDto } from './create-professional-qualification.dto';

export class UpdateProfessionalQualificationDto extends PartialType(CreateProfessionalQualificationDto) {}
