import { Expose } from 'class-transformer';
import { InspectionReportRequestStatus } from '../entities/inspection-report-request.entity';
import { AssessmentCategory } from '../../expert-assessment/entities/expert-assessment.entity';

export class AssessmentSubmissionRequestResponseDto {
  @Expose()
  id: string;

  @Expose()
  assessmentId: string;

  @Expose()
  score?: number;

  @Expose()
  remarks?: string;

  @Expose()
  filePath?: string;

  @Expose()
  fileMimeType?: string;

  @Expose()
  fileOriginalName?: string;

  @Expose()
  originalData?: {
    score?: number;
    remarks?: string;
    filePath?: string;
    fileMimeType?: string;
    fileOriginalName?: string;
  };

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

export class InspectionReportRequestResponseDto {
  @Expose()
  id: string;

  @Expose()
  inspectionReportId: string | null;

  @Expose()
  assessmentType: AssessmentCategory;

  @Expose()
  maximumScore: number;

  @Expose()
  obtainedScore: number;

  @Expose()
  percentage: number;

  @Expose()
  grade: string;

  @Expose()
  selectedGrade: number;

  @Expose()
  assessmentGradingRemarks: string;

  @Expose()
  overallComments: string;

  @Expose()
  warehouseOperatorApplicationId?: string;

  @Expose()
  warehouseLocationId?: string;

  @Expose()
  globalDocumentPath?: string;

  @Expose()
  globalDocumentMimeType?: string;

  @Expose()
  globalDocumentOriginalName?: string;

  @Expose()
  status: InspectionReportRequestStatus;

  @Expose()
  requestedBy?: string | null;

  @Expose()
  reviewedBy?: string | null;

  @Expose()
  reviewedAt?: Date | null;

  @Expose()
  reviewNotes?: string | null;

  @Expose()
  assessmentRequests: AssessmentSubmissionRequestResponseDto[];

  // Original snapshot (JSON)
  @Expose()
  originalData?: {
    maximumScore?: number;
    obtainedScore?: number;
    percentage?: number;
    grade?: string;
    selectedGrade?: number;
    assessmentGradingRemarks?: string;
    overallComments?: string;
    globalDocumentPath?: string;
    globalDocumentMimeType?: string;
    globalDocumentOriginalName?: string;
  };

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

