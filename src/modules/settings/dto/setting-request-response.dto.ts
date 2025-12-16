import { Expose } from 'class-transformer';
import { SettingRequestStatus, SettingRequestAction } from '../entities/setting-request.entity';

export class SettingRequestResponseDto {
  @Expose()
  id: string;

  @Expose()
  settingId: string | null;

  @Expose()
  key: string;

  @Expose()
  value: string;

  @Expose()
  iv?: string;

  @Expose()
  authTag?: string;

  @Expose()
  mimeType?: string;

  @Expose()
  originalName?: string;

  @Expose()
  status: SettingRequestStatus;

  @Expose()
  action: SettingRequestAction;

  @Expose()
  requestedBy?: string | null;

  @Expose()
  reviewedBy?: string | null;

  @Expose()
  reviewedAt?: Date | null;

  @Expose()
  reviewNotes?: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  originalKey?: string;

  @Expose()
  originalValue?: string;

  @Expose()
  originalMimeType?: string;

  @Expose()
  originalOriginalName?: string;
}
