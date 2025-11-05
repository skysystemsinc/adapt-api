import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFieldRequestDto {
  @ApiProperty({ description: 'Field key (unique identifier)' })
  @IsString()
  @IsNotEmpty()
  fieldKey: string;

  @ApiProperty({ description: 'Field label', required: false })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ description: 'Field title (for headings)', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Field type' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Field options', required: false })
  @IsOptional()
  options?: any;

  @ApiProperty({ description: 'Is field required', default: false })
  @IsOptional()
  required?: boolean;

  @ApiProperty({ description: 'Is single checkbox', default: false })
  @IsOptional()
  isSingle?: boolean;

  @ApiProperty({ description: 'Placeholder text', required: false })
  @IsString()
  @IsOptional()
  placeholder?: string;

  @ApiProperty({ description: 'Validation rules', required: false })
  @IsOptional()
  validation?: any;

  @ApiProperty({ description: 'Conditional visibility rules', required: false })
  @IsOptional()
  conditions?: any;

  @ApiProperty({ description: 'Field order' })
  @IsNotEmpty()
  order: number;

  @ApiProperty({ description: 'Step number' })
  @IsNotEmpty()
  step: number;

  @ApiProperty({ description: 'Field metadata', required: false })
  @IsOptional()
  metadata?: any;

  @ApiProperty({ description: 'Field width', default: 'full' })
  @IsString()
  @IsOptional()
  width?: string;

  @ApiProperty({ description: 'Include in KYC verification', default: false })
  @IsOptional()
  includeInKycVerification?: boolean;

  @ApiProperty({ description: 'Version marker (v1, v2, etc.)', required: false })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({ description: 'Original field ID (if updating/deleting)', required: false })
  @IsString()
  @IsOptional()
  originalFieldId?: string;

  @ApiProperty({ description: 'Action: create, update, or delete', default: 'update' })
  @IsString()
  @IsOptional()
  action?: 'create' | 'update' | 'delete';
}

export class CreateFormRequestDto {
  @ApiProperty({ description: 'Form ID this request is for' })
  @IsString()
  @IsNotEmpty()
  formId: string;

  @ApiProperty({ description: 'Form title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Form slug' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: 'Form description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Form schema' })
  @IsObject()
  @IsNotEmpty()
  schema: any;

  @ApiProperty({ description: 'Form fields', type: [CreateFieldRequestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldRequestDto)
  fields: CreateFieldRequestDto[];
}

