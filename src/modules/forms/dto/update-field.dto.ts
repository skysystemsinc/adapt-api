import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, IsObject } from 'class-validator';

export class UpdateFieldDto {
  @ApiProperty({
    description: 'Unique key for the field',
    example: 'email_address',
    required: false,
  })
  @IsString()
  @IsOptional()
  fieldKey?: string;

  @ApiProperty({
    description: 'Field label (for input fields)',
    example: 'Email Address',
    required: false,
  })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({
    description: 'Field title (for heading fields)',
    example: 'Personal Information',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Field type',
    example: 'email',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'Options for select/radio/checkbox fields',
    required: false,
  })
  @IsOptional()
  options?: any;

  @ApiProperty({
    description: 'Whether the field is required',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiProperty({
    description: 'For checkbox: true = single checkbox (boolean), false = multiple options',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isSingle?: boolean;

  @ApiProperty({
    description: 'Placeholder text',
    example: 'Enter your email',
    required: false,
  })
  @IsString()
  @IsOptional()
  placeholder?: string;

  @ApiProperty({
    description: 'Validation rules',
    required: false,
  })
  @IsObject()
  @IsOptional()
  validation?: any;

  @ApiProperty({
    description: 'Conditional visibility rules',
    required: false,
  })
  @IsOptional()
  conditions?: any;

  @ApiProperty({
    description: 'Order of the field within its step',
    required: false,
  })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiProperty({
    description: 'Step number (for multi-step forms)',
    required: false,
  })
  @IsInt()
  @IsOptional()
  step?: number;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: any;

  @ApiProperty({
    description: 'Field width in the form layout',
    example: 'full',
    enum: ['full', 'half'],
    default: 'full',
    required: false,
  })
  @IsString()
  @IsOptional()
  width?: 'full' | 'half';

  @ApiProperty({
    description: 'Whether this field should be included in KYC verification',
    example: false,
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  includeInKycVerification?: boolean;
}

