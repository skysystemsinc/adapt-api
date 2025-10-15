import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import dayjs from 'dayjs';
import { FormStatus } from '../entities/form.entity';
import { FormStepResponseDto } from './form-step-response.dto';

export class FormResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  slug: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty()
  @Expose()
  schema: any;

  @ApiProperty({ 
    type: [FormStepResponseDto],
    description: 'Form fields grouped by step (from form_fields table)'
  })
  @Expose()
  @Type(() => FormStepResponseDto)
  steps: FormStepResponseDto[];

  @ApiProperty()
  @Expose()
  isPublic: boolean;

  @ApiProperty({ enum: FormStatus })
  @Expose()
  status: FormStatus;

  @ApiProperty()
  @Expose()
  createdBy: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }: { value: Date }) =>
    dayjs(value).format('DD-MMM-YYYY HH:mm'),
  )
  createdAt: Date;

  @ApiProperty()
  @Expose()
  @Transform(({ value }: { value: Date }) =>
    dayjs(value).format('DD-MMM-YYYY HH:mm'),
  )
  updatedAt: Date;
}

