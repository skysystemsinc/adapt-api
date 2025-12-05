import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

