import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class FormFieldResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  fieldKey: string;

  @ApiProperty({ required: false })
  @Expose()
  label?: string;

  @ApiProperty({ required: false })
  @Expose()
  title?: string; // For heading fields

  @ApiProperty()
  @Expose()
  type: string;

  @ApiProperty({ required: false })
  @Expose()
  options?: any;

  @ApiProperty()
  @Expose()
  required: boolean;

  @ApiProperty()
  @Expose()
  isSingle: boolean;

  @ApiProperty({ required: false })
  @Expose()
  placeholder?: string;

  @ApiProperty({ required: false })
  @Expose()
  validation?: any;

  @ApiProperty({ required: false })
  @Expose()
  conditions?: any;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty({ required: false })
  @Expose()
  metadata?: any;

  @ApiProperty({ required: false, enum: ['full', 'half'], default: 'full' })
  @Expose()
  width?: 'full' | 'half';
}

