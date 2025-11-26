import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ExpertAssessment } from "../../entities/expert-assessment.entity";
import { AssessmentDocument } from "../../assessment-documents/entities/assessment-document.entity";
import { WarehouseOperatorApplicationRequest } from "../../../warehouse/entities/warehouse-operator-application-request.entity";
import { WarehouseLocation } from "../../../warehouse-location/entities/warehouse-location.entity";
import { InspectionReport } from "../../../inspection-reports/entities/inspection-report.entity";

export enum ExpertAssessmentSubmissionStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    UNDER_REVIEW = 'under_review',
}

@Entity("expert_assessment_submissions")
export class AssessmentSubmission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    score?: number;

    @Column({ type: 'text', nullable: true })
    remarks?: string;

    @Column({
        type: 'enum',
        enum: ExpertAssessmentSubmissionStatus,
        default: ExpertAssessmentSubmissionStatus.PENDING,
    })
    status: ExpertAssessmentSubmissionStatus;

    @Column({ type: 'uuid' })
    assessmentId: string;

    @ManyToOne(() => ExpertAssessment, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assessmentId' })
    assessment: ExpertAssessment;

    @Column({ type: 'uuid', nullable: true })
    warehouseOperatorApplicationId?: string;

    @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'warehouseOperatorApplicationId' })
    warehouseOperatorApplication?: WarehouseOperatorApplicationRequest;

    @Column({ type: 'uuid', nullable: true })
    warehouseLocationId?: string;

    @ManyToOne(() => WarehouseLocation, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation?: WarehouseLocation;

    @Column({ type: 'uuid', nullable: true })
    inspectionReportId?: string;

    @ManyToOne(() => InspectionReport, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'inspectionReportId' })
    inspectionReport?: InspectionReport;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => AssessmentDocument, (document) => document.submission)
    documents: AssessmentDocument[];
}
