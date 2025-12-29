import { Expose } from 'class-transformer';
import { AssessmentSubSectionRequestStatus, AssessmentSubSectionRequestAction } from '../entities/assessment-sub-section-request.entity';

export class AssessmentSubSectionRequestResponseDto {
  @Expose()
  id: string;

  @Expose()
  subSectionId: string | null;

  @Expose()
  assessmentId: string;

  @Expose()
  name: string;

  @Expose()
  order: number;

  @Expose()
  isActive: boolean;

  @Expose()
  originalData?: {
    name?: string;
    order?: number;
    isActive?: boolean;
  } | null;

  @Expose()
  status: AssessmentSubSectionRequestStatus;

  @Expose()
  action: AssessmentSubSectionRequestAction;

  @Expose()
  requestedBy?: string;

  @Expose()
  reviewedBy?: string;

  @Expose()
  reviewedAt?: Date;

  @Expose()
  reviewNotes?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
