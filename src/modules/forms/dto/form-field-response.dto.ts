import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class FormFieldResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  fieldKey: string;

  @ApiProperty()
  @Expose()
  label: string;

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
  metadata?: any;
}

