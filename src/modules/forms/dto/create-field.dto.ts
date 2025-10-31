import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsObject,
} from 'class-validator';

export class CreateFieldDto {
  @ApiProperty({
    description: 'Unique key for the field',
    example: 'email_address',
  })
  @IsString()
  @IsNotEmpty()
  fieldKey: string;

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
    enum: [
      'text',
      'email',
      'number',
      'textarea',
      'select',
      'radio',
      'checkbox',
      'file',
      'date',
      'heading',
    ],
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Options for select/radio/checkbox fields',
    example: [
      { id: 'opt1', label: 'Option 1', value: 'option1' },
      { id: 'opt2', label: 'Option 2', value: 'option2' },
    ],
    required: false,
  })
  @IsOptional()
  options?: any;

  @ApiProperty({
    description: 'Whether the field is required',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiProperty({
    description: 'For checkbox: true = single checkbox (boolean), false = multiple options',
    example: false,
    default: false,
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
    example: { min: 5, max: 100, pattern: '^[a-z]+$' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  validation?: any;

  @ApiProperty({
    description: 'Conditional visibility rules',
    example: [{ field: 'country', operator: '==', value: 'US' }],
    required: false,
  })
  @IsOptional()
  conditions?: any;

  @ApiProperty({
    description: 'Order of the field within its step',
    example: 0,
  })
  @IsInt()
  @IsNotEmpty()
  order: number;

  @ApiProperty({
    description: 'Step number (for multi-step forms)',
    example: 0,
  })
  @IsInt()
  @IsNotEmpty()
  step: number;

  @ApiProperty({
    description: 'Additional metadata (e.g., step title for first field)',
    example: { stepTitle: 'Personal Details' },
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
}

