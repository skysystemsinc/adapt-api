import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';

const transformToBoolean = (value: any): boolean => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
}

export class CreateProfessionalQualificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  certificationTitle: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  issuingBody: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @IsDateString()
  @IsOptional()
  dateOfAward?: Date | null;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  membershipNumber?: string;

  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  @IsOptional()
  hasExpiryDate?: boolean;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Professional certificate file (PDF, PNG, JPG, JPEG, DOC, DOCX). Max size: 10MB',
    required: false,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null) return undefined;
    return value;
  })
  @IsOptional()
  @Exclude()
  professionalCertificate?: any;
}
