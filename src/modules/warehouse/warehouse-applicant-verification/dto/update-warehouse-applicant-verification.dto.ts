import { PartialType } from '@nestjs/swagger';
import { CreateWarehouseApplicantVerificationDto } from './create-warehouse-applicant-verification.dto';

export class UpdateWarehouseApplicantVerificationDto extends PartialType(CreateWarehouseApplicantVerificationDto) {}
