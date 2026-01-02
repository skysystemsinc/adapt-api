import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';

export class CreateAcademicQualificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  degree: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  major: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  institute: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  yearOfPassing: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  grade?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Academic certificate as base64-encoded string or existing document ID (UUID)',
    example: 'data:application/pdf;base64,JVBERi0xLjQK...',
    required: false,
  })
  @IsOptional()
  @IsString()
  academicCertificate?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for academic certificate (required if academicCertificate is base64)',
    required: false,
  })
  @IsOptional()
  @IsString()
  academicCertificateFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for academic certificate (required if academicCertificate is base64)',
    required: false,
  })
  @IsOptional()
  @IsString()
  academicCertificateMimeType?: string;
}
