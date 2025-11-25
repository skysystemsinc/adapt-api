import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';

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
