import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength, ValidateIf, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, Validate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';

@ValidatorConstraint({ name: 'isDateOfAppointmentBeforeLeaving', async: false })
export class IsDateOfAppointmentBeforeLeavingConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const dto = args.object as CreateProfessionalExperienceDto;
    if (!dto.dateOfAppointment || !dto.dateOfLeaving) {
      return true; // Skip validation if either date is missing
    }
    const appointmentDate = new Date(dto.dateOfAppointment);
    const leavingDate = new Date(dto.dateOfLeaving);
    return appointmentDate <= leavingDate;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Date of Appointment must be before or equal to Date of Leaving';
  }
}

@ValidatorConstraint({ name: 'isExperienceLetterRequiredWhenLeaving', async: false })
export class IsExperienceLetterRequiredWhenLeavingConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const dto = args.object as CreateProfessionalExperienceDto;
    // If dateOfLeaving is provided, experienceLetter must be provided
    if (dto.dateOfLeaving) {
      return value !== undefined && value !== null && value !== '';
    }
    return true; // Optional if dateOfLeaving is not provided
  }

  defaultMessage(args: ValidationArguments) {
    return 'Experience Letter is required when Date of Leaving is provided';
  }
}

export class CreateProfessionalExperienceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  positionHeld: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  organizationName: string;

  @IsString()
  @IsNotEmpty()
  organizationAddress: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  natureOfOrganization: string;

  @IsDateString()
  @IsOptional()
  @ValidateIf((o) => o.dateOfAppointment && o.dateOfLeaving)
  @Validate(IsDateOfAppointmentBeforeLeavingConstraint)
  dateOfAppointment?: Date | null;

  @IsDateString()
  @IsOptional()
  dateOfLeaving?: Date | null;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  duration?: string;

  @IsString()
  @IsOptional()
  responsibilities?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Experience letter as base64-encoded string or existing document ID (UUID). Required when dateOfLeaving is provided.',
    example: 'data:application/pdf;base64,JVBERi0xLjQK...',
    required: false,
  })
  @ValidateIf((o) => o.dateOfLeaving)
  @Validate(IsExperienceLetterRequiredWhenLeavingConstraint)
  @IsOptional()
  @IsString()
  experienceLetter?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for experience letter (required if experienceLetter is base64)',
    required: false,
  })
  @IsOptional()
  @IsString()
  experienceLetterFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for experience letter (required if experienceLetter is base64)',
    required: false,
  })
  @IsOptional()
  @IsString()
  experienceLetterMimeType?: string;
}
