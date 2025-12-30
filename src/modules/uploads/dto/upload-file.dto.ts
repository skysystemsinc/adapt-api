import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UploadFileDto {
  @ApiProperty({
    description: 'Form ID (UUID)',
    example: 'd1ac02a6-a483-4a80-8a62-1f2de08dfaca',
  })
  @IsUUID()
  @IsNotEmpty()
  formId: string;

  @ApiProperty({
    description: 'Field ID (UUID) from form_fields table',
    example: 'd1ac02a6-a483-4a80-8a62-1f2de08dfaca',
  })
  @IsUUID()
  @IsNotEmpty()
  fieldId: string;

  @ApiProperty({
    description: 'Optional user ID if authenticated',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

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

export class UploadFileResponseDto {
  @ApiProperty({
    description: 'Uploaded file URL',
    example: '/uploads/d1ac02a6-a483-4a80-8a62-1f2de08dfaca.pdf',
  })
  url: string;

  @ApiProperty({
    description: 'File path on server',
    example: 'uploads/d1ac02a6-a483-4a80-8a62-1f2de08dfaca.pdf',
  })
  path: string;

  @ApiProperty({
    description: 'Original filename (sanitized)',
    example: 'document.pdf',
  })
  originalName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: 'MIME type',
    example: 'application/pdf',
  })
  mimeType: string;

  @ApiProperty({
    description: 'IV',
    example: 'd1ac02a6-a483-4a80-8a62-1f2de08dfaca',
  })
  iv: string;

  @ApiProperty({
    description: 'Auth tag',
    example: 'd1ac02a6-a483-4a80-8a62-1f2de08dfaca',
  })
  authTag: string;
}

export class ScanFileDto {
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

export class BatchScanFileDto {
  @ApiProperty({
    type: [ScanFileDto],
    description: 'Array of files to scan',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScanFileDto)
  @IsNotEmpty()
  files: ScanFileDto[];
}

