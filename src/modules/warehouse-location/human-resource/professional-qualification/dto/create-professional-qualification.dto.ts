import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  @ApiPropertyOptional({
    type: String,
    description: 'Professional certificate as base64-encoded string or existing document ID (UUID)',
    example: 'data:application/pdf;base64,JVBERi0xLjQK...',
    required: false,
  })
  @IsOptional()
  @IsString()
  professionalCertificate?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for professional certificate (required if professionalCertificate is base64)',
    required: false,
  })
  @IsOptional()
  @IsString()
  professionalCertificateFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for professional certificate (required if professionalCertificate is base64)',
    required: false,
  })
  @IsOptional()
  @IsString()
  professionalCertificateMimeType?: string;
}
