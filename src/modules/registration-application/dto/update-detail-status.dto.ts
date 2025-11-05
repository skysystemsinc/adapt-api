import { IsEnum, IsString, ValidateIf } from 'class-validator';
import { DetailStatus } from '../entities/registration-application-details.entity';

export class UpdateDetailStatusDto {
  @IsEnum(DetailStatus)
  status: DetailStatus;

  @ValidateIf(o => o.status === DetailStatus.REJECTED)
  @IsString()
  remarks?: string;
}

