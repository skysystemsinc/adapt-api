import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { AssessmentSubmission } from "../../assessment-submission/entities/assessment-submission.entity";
import { User } from "../../../users/entities/user.entity";
import { InspectionReport } from "../../../inspection-reports/entities/inspection-report.entity";
import { InspectionReportHistory } from "../../../inspection-reports/entities/inspection-report-history.entity";
import { AssessmentSubmissionHistory } from "../../assessment-submission/entities/assessment-submission-history.entity";

@Entity('expert_assessment_documents')
export class AssessmentDocument {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true })
    submissionId?: string;

    @Column({ type: 'uuid', nullable: true })
    submissionHistoryId?: string;

    @Column({ type: 'uuid', nullable: true })
    inspectionReportId?: string;

    @Column({ type: 'uuid', nullable: true })
    inspectionReportHistoryId?: string;

    @Column({ type: 'uuid', nullable: true })

    @Column({ type: 'varchar', length: 255 })
    fileName: string;

    @Column({ type: 'varchar', length: 500 })
    filePath: string;

    @Column({ type: 'varchar', length: 100 })
    fileType: string;

    @Column({ type: 'bigint' })
    fileSize: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    documentType?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    iv?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    authTag?: string;

    @Column({ type: 'uuid', nullable: true })
    uploadedBy: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'uploadedBy' })
    uploadedByUser: User;

    @ManyToOne(() => AssessmentSubmission, (submission) => submission.documents, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    @JoinColumn({ name: 'submissionId' })
    submission?: AssessmentSubmission;
    
    @ManyToOne(() => AssessmentSubmissionHistory, (submissionHistory) => submissionHistory.documentsHistory, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    @JoinColumn({ name: 'submissionHistoryId' })
    submissionHistory?: AssessmentSubmissionHistory;

    @ManyToOne(() => InspectionReport, (report) => report.documents, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    @JoinColumn({ name: 'inspectionReportId' })
    inspectionReport?: InspectionReport;

    @ManyToOne(() => InspectionReportHistory, (reportHistory) => reportHistory.documentsHistory, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    @JoinColumn({ name: 'inspectionReportHistoryId' })
    inspectionReportHistory?: InspectionReportHistory;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
