import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength, ValidateIf, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, Validate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Experience letter file (PDF, PNG, JPG, JPEG, DOC, DOCX). Max size: 10MB',
    required: false,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null) return undefined;
    return value;
  })
  @IsOptional()
  @Exclude()
  experienceLetter?: any;
}
