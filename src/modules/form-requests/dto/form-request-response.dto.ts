import { Expose } from 'class-transformer';
import { FormRequestStatus } from '../entities/form-request.entity';

export class FormFieldRequestResponseDto {
  @Expose()
  id: string;

  @Expose()
  fieldKey: string;

  @Expose()
  label?: string;

  @Expose()
  title?: string;

  @Expose()
  type: string;

  @Expose()
  options?: any;

  @Expose()
  required: boolean;

  @Expose()
  isSingle: boolean;

  @Expose()
  placeholder?: string;

  @Expose()
  validation?: any;

  @Expose()
  conditions?: any;

  @Expose()
  order: number;

  @Expose()
  step: number;

  @Expose()
  metadata?: any;

  @Expose()
  width: string;

  @Expose()
  includeInKycVerification: boolean;

  @Expose()
  version?: string;

  @Expose()
  originalFieldId?: string;

  @Expose()
  action: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

export class FormRequestResponseDto {
  @Expose()
  id: string;

  @Expose()
  formId: string;

  @Expose()
  title: string;

  @Expose()
  slug: string;

  @Expose()
  description?: string;

  @Expose()
  schema: any;

  @Expose()
  isPublic: boolean;

  @Expose()
  status: FormRequestStatus;

  @Expose()
  version?: string;

  @Expose()
  requestedBy?: string;

  @Expose()
  reviewedBy?: string;

  @Expose()
  reviewedAt?: Date;

  @Expose()
  reviewNotes?: string;

  @Expose()
  fields: FormFieldRequestResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

