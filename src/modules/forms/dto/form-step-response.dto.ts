import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { FormFieldResponseDto } from './form-field-response.dto';

export class FormStepResponseDto {
  @ApiProperty({ description: 'Step number (0-indexed)' })
  @Expose()
  stepNumber: number;

  @ApiProperty({ type: [FormFieldResponseDto] })
  @Expose()
  @Type(() => FormFieldResponseDto)
  fields: FormFieldResponseDto[];
}

