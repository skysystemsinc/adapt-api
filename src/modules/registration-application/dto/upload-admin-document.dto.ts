import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadAdminDocumentDto {
  @ApiProperty({
    type: 'string',
    format: 'base64',
    description: 'File content encoded as base64 string',
  })
  @IsString()
  @IsNotEmpty()
  file: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'document.pdf',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      return isNaN(num) ? value : num;
    }
    return value;
  })
  @IsNumber()
  @IsNotEmpty()
  fileSize: number;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class AdminDocumentResponseDto {
  @ApiProperty({ description: 'Document ID' })
  id: string;

  @ApiProperty({ description: 'Application ID' })
  applicationId: string;

  @ApiProperty({ description: 'Detail ID' })
  detailId: string;

  @ApiProperty({ description: 'Document file path' })
  document: string;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'IV' })
  iv?: string;

  @ApiPropertyOptional({ description: 'Auth tag' })
  authTag?: string;
}

export class UploadAdminDocumentResponseDto extends AdminDocumentResponseDto {}

