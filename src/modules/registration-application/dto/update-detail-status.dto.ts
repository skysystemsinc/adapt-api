import { IsEnum } from 'class-validator';
import { DetailStatus } from '../entities/registration-application-details.entity';

export class UpdateDetailStatusDto {
  @IsEnum(DetailStatus)
  status: DetailStatus;
}

