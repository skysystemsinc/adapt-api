import { Expose, Type } from 'class-transformer';

export class RegistrationDetailResponseDto {
  @Expose()
  id: string;

  @Expose()
  key: string;

  @Expose()
  value: string;

  @Expose()
  label: string | null;

  @Expose()
  status: string;

  @Expose()
  createdAt: Date;
}

export class RegistrationResponseDto {
  @Expose()
  id: string;

  @Expose()
  formId: string;

  @Expose()
  status: string;

  @Expose()
  ipAddress?: string;

  @Expose()
  userAgent?: string;

  @Expose()
  referrer?: string;

  @Expose()
  metadata?: any;

  @Expose()
  @Type(() => RegistrationDetailResponseDto)
  details: RegistrationDetailResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

