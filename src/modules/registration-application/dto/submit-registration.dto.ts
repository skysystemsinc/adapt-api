import { IsString, IsArray, IsOptional, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FieldValueDto {
  @ApiProperty({ description: 'Field key identifier' })
  @IsString()
  @IsNotEmpty()
  fieldKey: string;

  @ApiProperty({ description: 'Field value (any type)' })
  @IsNotEmpty()
  value: any;
}

export class SubmitRegistrationDto {
  @ApiProperty({ description: 'Form ID that was submitted' })
  @IsString()
  @IsNotEmpty()
  formId: string;

  @ApiProperty({ description: 'Application type slug (extracted from form slug)' })
  @IsString()
  @IsNotEmpty()
  applicationTypeSlug: string;

  @ApiProperty({ type: [FieldValueDto], description: 'Array of field values' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  values: FieldValueDto[];

  @ApiProperty({ required: false, description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

