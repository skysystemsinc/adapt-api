import { ApiProperty } from '@nestjs/swagger';

export class UploadAdminDocumentResponseDto {
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
}

