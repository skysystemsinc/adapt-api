import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadOperatorCertificateDto {
  @ApiProperty({
    type: String,
    description: 'Certificate file as base64-encoded string',
    example: 'data:application/pdf;base64,JVBERi0xLjQK...',
  })
  @IsString()
  @IsNotEmpty()
  certificate: string;

  @ApiProperty({
    type: String,
    description: 'Original filename for certificate',
    example: 'operator-certificate.pdf',
  })
  @IsString()
  @IsNotEmpty()
  certificateFileName: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for certificate',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  certificateMimeType?: string;
}

