import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsNumber,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating a warehouse document
 */
export class CreateWarehouseDocumentDto {
  @ApiProperty({
    description: 'User ID who owns/uploaded the document',
    example: 'd1ac02a6-a483-4a80-8a62-1f2de08dfaca',
  })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Type of the entity this document belongs to (polymorphic)',
    example: 'CompanyInformation',
    enum: ['CompanyInformation', 'BankDetails', 'FinancialInformation', 'HRInformation'],
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentableType!: string;

  @ApiProperty({
    description: 'ID of the entity this document belongs to (polymorphic)',
    example: 'd1ac02a6-a483-4a80-8a62-1f2de08dfaca',
  })
  @IsUUID()
  @IsNotEmpty()
  documentableId!: string;

  @ApiProperty({
    description: 'Document type identifier (e.g., ntcCertificate, bankStatement, auditReport)',
    example: 'ntcCertificate',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentType!: string;

  @ApiProperty({
    description: 'Original filename as uploaded by user',
    example: 'ntc_certificate.pdf',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalFileName!: string;

  @ApiProperty({
    description: 'File path where the document is stored',
    example: '/uploads/warehouse/ntc_certificate_abc123.pdf',
  })
  @IsString()
  @IsNotEmpty()
  filePath!: string;

  @ApiPropertyOptional({
    description: 'MIME type of the file',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

//   @ApiPropertyOptional({
//     description: 'File size in bytes',
//     example: 1024000,
//   })
//   @IsOptional()
//   @IsNumber()
//   fileSize?: number;

//   @ApiPropertyOptional({
//     description: 'Optional description or notes about the document',
//     example: 'NTC Certificate for company registration',
//   })
//   @IsOptional()
//   @IsString()
//   description?: string;

  @ApiPropertyOptional({
    description: 'Whether the document is active/visible',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * DTO for updating a warehouse document
 */
export class UpdateWarehouseDocumentDto {
  @ApiPropertyOptional({
    description: 'Optional description or notes about the document',
    example: 'Updated NTC Certificate',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the document is active/visible',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Response DTO for warehouse document
 */
export class WarehouseDocumentResponseDto {
  @ApiProperty({
    description: 'Document ID',
    example: 'd1ac02a6-a483-4a80-8a62-1f2de08dfaca',
  })
  id!: string;

  @ApiProperty({
    description: 'User ID who owns/uploaded the document',
  })
  userId!: string;

  @ApiProperty({
    description: 'Type of the entity this document belongs to',
  })
  documentableType!: string;

  @ApiProperty({
    description: 'ID of the entity this document belongs to',
  })
  documentableId!: string;

  @ApiProperty({
    description: 'Document type identifier',
  })
  documentType!: string;

  @ApiProperty({
    description: 'Original filename',
  })
  originalFileName!: string;

  @ApiProperty({
    description: 'File path',
  })
  filePath!: string;

  @ApiPropertyOptional({
    description: 'MIME type',
  })
  mimeType?: string;

//   @ApiPropertyOptional({
//     description: 'File size in bytes',
//   })
//   fileSize?: number;

//   @ApiPropertyOptional({
//     description: 'Description',
//   })
//   description?: string;

  @ApiProperty({
    description: 'Whether the document is active',
  })
  isActive!: boolean;

  @ApiProperty({
    description: 'Created at timestamp',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
  })
  updatedAt!: Date;
}

