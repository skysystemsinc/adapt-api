import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import dayjs from 'dayjs';
import { FormStatus } from '../entities/form.entity';

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

