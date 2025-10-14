import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsString,
  IsUUID,
  ValidateNested,
  Allow,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubmissionStatus } from '../entities/form-submission.entity';

export class FormFieldValueDto {
  @ApiProperty({
    description: 'Field key (ID) from form schema',
    example: 'email-field',
  })
  @IsString()
  @IsNotEmpty()
  fieldKey: string;

  @ApiProperty({
    description: 'Field value (can be string, number, boolean, array, or object)',
    example: 'john@example.com',
  })
  @Allow() // Allow any value type without strict validation
  value: any; // Can be string, number, boolean, array, object, File, etc.
}

export class SubmitFormDto {
  @ApiProperty({
    description: 'Form ID (UUID)',
    example: 'd1ac02a6-a483-4a80-8a62-1f2de08dfaca',
  })
  @IsUUID()
  @IsNotEmpty()
  formId: string;

  @ApiProperty({
    description: 'Form field values',
    type: [FormFieldValueDto],
    example: [
      { fieldKey: 'email-field', value: 'john@example.com' },
      { fieldKey: 'name-field', value: 'John Doe' },
      { fieldKey: 'agree-checkbox', value: true },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldValueDto)
  values: FormFieldValueDto[];

  @ApiProperty({
    description: 'Optional user ID if submission is from logged-in user',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Submission status',
    enum: SubmissionStatus,
    default: SubmissionStatus.SUBMITTED,
    required: false,
  })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @ApiProperty({
    description: 'Optional metadata (user agent, IP, etc.)',
    example: {
      userAgent: 'Mozilla/5.0...',
      ipAddress: '192.168.1.1',
    },
    required: false,
  })
  @IsOptional()
  meta?: Record<string, any>;
}

