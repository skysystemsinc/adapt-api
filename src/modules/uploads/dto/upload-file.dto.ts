import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
    format: 'binary',
    description: 'File to upload',
  })
  file: any; // Multer file type
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
}

