import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type, Transform } from 'class-transformer';
import dayjs from 'dayjs';
import { SubmissionStatus } from '../entities/form-submission.entity';

class SubmissionValueDto {
  @ApiProperty()
  @Expose()
  fieldKey: string;

  @ApiProperty()
  @Expose()
  value: string;

  @ApiProperty({ description: 'Resolved label at time of submission (for conditional labels)', nullable: true })
  @Expose()
  label: string | null;
}

export class FormSubmissionResponseDto {
  @ApiProperty({ description: 'Submission ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Form ID' })
  @Expose()
  formId: string;

  @ApiProperty({ description: 'User ID (if logged in)', nullable: true })
  @Expose()
  userId: string | null;

  @ApiProperty({ description: 'Submission timestamp' })
  @Expose()
  @Transform(({ value }: { value: Date }) =>
    dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
  )
  submittedAt: Date;

  @ApiProperty({
    description: 'Submission status',
    enum: SubmissionStatus,
  })
  @Expose()
  status: SubmissionStatus;

  @ApiProperty({
    description: 'Form field values',
    type: [SubmissionValueDto],
  })
  @Expose()
  @Type(() => SubmissionValueDto)
  values: SubmissionValueDto[];

  @ApiProperty({ description: 'Optional metadata', nullable: true })
  @Expose()
  meta: Record<string, any> | null;

  @ApiProperty()
  @Expose()
  @Transform(({ value }: { value: Date }) =>
    dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
  )
  createdAt: Date;

  @ApiProperty()
  @Expose()
  @Transform(({ value }: { value: Date }) =>
    dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
  )
  updatedAt: Date;
}

