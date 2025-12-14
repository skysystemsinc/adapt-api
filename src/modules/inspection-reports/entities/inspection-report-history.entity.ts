import { AssessmentCategory } from "../../expert-assessment/entities/expert-assessment.entity";
import { AssessmentSubmission } from "../../expert-assessment/assessment-submission/entities/assessment-submission.entity";
import { AssessmentDocument } from "../../expert-assessment/assessment-documents/entities/assessment-document.entity";
import { User } from "../../users/entities/user.entity";
import { WarehouseLocation } from "../../warehouse-location/entities/warehouse-location.entity";
import { WarehouseOperatorApplicationRequest } from "../../warehouse/entities/warehouse-operator-application-request.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { InspectionReport, InspectionReportStatus } from "./inspection-report.entity";
import { AssessmentSubmissionHistory } from "../../expert-assessment/assessment-submission/entities/assessment-submission-history.entity";

@Entity('inspection_reports_history')
export class InspectionReportHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true })
    inspectionReportId?: string;

    @ManyToOne(() => InspectionReport, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'inspectionReportId' })
    inspectionReport?: InspectionReport;

    @Column({
        type: 'enum',
        enum: AssessmentCategory,
    })
    assessmentType: AssessmentCategory;

    // Overall Inspection Findings
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    maximumScore: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    obtainedScore: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    percentage: number;

    @Column({ type: 'varchar', length: 10 })
    grade: string;

    // Assessment Grading
    @Column({ type: 'int' })
    selectedGrade: number; // 1-5

    @Column({ type: 'text' })
    assessmentGradingRemarks: string;

    // Evaluation Summary
    @Column({ type: 'text' })
    overallComments: string;

    // Relationships
    @Column({ type: 'uuid', nullable: true })
    warehouseOperatorApplicationId?: string;

    @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'warehouseOperatorApplicationId' })
    warehouseOperatorApplication?: WarehouseOperatorApplicationRequest;

    @Column({ type: 'uuid', nullable: true })
    warehouseLocationId?: string;

    @ManyToOne(() => WarehouseLocation, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation?: WarehouseLocation;

    @Column({ type: 'text', nullable: true })
    remarks: string;

    @Column({ type: 'uuid', nullable: true })
    approvedBy?: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'approvedBy' })
    approvedByUser?: User;

    @Column({ type: 'timestamp', nullable: true })
    approvedAt?: Date;

    @Column({ type: 'uuid', nullable: true })
    createdBy?: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'createdBy' })
    createdByUser?: User;

    @OneToMany(() => AssessmentSubmissionHistory, (submissionHistory) => submissionHistory.inspectionReportHistory)
    assessmentSubmissionsHistory: AssessmentSubmissionHistory[];

    @OneToMany(() => AssessmentDocument, (documentHistory) => documentHistory.inspectionReportHistory)
    documentsHistory: AssessmentDocument[];

    @Column({
        type: 'enum',
        enum: InspectionReportStatus,
        default: InspectionReportStatus.PENDING,
    })
    status: InspectionReportStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}