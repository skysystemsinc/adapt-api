import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';

export class CreateTrainingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  trainingTitle: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  conductedBy: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  trainingType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  duration: string;

  @IsDateString()
  @IsOptional()
  dateOfCompletion?: Date | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Training certificate as base64-encoded string or existing document ID (UUID)',
    example: 'data:application/pdf;base64,JVBERi0xLjQK...',
    required: false,
  })
  @IsOptional()
  @IsString()
  trainingCertificate?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for training certificate (required if trainingCertificate is base64)',
    required: false,
  })
  @IsOptional()
  @IsString()
  trainingCertificateFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for training certificate (required if trainingCertificate is base64)',
    required: false,
  })
  @IsOptional()
  @IsString()
  trainingCertificateMimeType?: string;
}
