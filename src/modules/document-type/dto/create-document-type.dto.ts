import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateDocumentTypeDto {
  @ApiProperty({ description: 'Document type name', example: 'CNIC' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Is active', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

