import { Expose } from 'class-transformer';
import { ExpertAssessmentRequestStatus, ExpertAssessmentRequestAction } from '../entities/expert-assessment-request.entity';
import { AssessmentCategory } from '../entities/expert-assessment.entity';

export class ExpertAssessmentRequestResponseDto {
  @Expose()
  id: string;

  @Expose()
  assessmentId: string | null;

  @Expose()
  name: string;

  @Expose()
  category: AssessmentCategory;

  @Expose()
  isActive: boolean;

  @Expose()
  originalData?: {
    name?: string;
    category?: AssessmentCategory;
    isActive?: boolean;
  } | null;

  @Expose()
  status: ExpertAssessmentRequestStatus;

  @Expose()
  action: ExpertAssessmentRequestAction;

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
