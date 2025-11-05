import { IsEnum, IsString, ValidateIf } from 'class-validator';
import { ApplicationStatus } from '../entities/registration-application.entity';

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ValidateIf(o => o.status === ApplicationStatus.REJECTED)
  @IsString()
  remarks?: string;
}

