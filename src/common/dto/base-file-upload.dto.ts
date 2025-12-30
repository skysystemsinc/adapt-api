import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Base DTO for single file upload with base64 encoding
 * Can be extended or used directly in controllers
 */
export class BaseFileUploadDto {
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

