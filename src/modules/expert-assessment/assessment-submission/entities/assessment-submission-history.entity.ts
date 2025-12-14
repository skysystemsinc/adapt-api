import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ExpertAssessment } from "../../entities/expert-assessment.entity";
import { AssessmentDocument } from "../../assessment-documents/entities/assessment-document.entity";
import { WarehouseOperatorApplicationRequest } from "../../../warehouse/entities/warehouse-operator-application-request.entity";
import { WarehouseLocation } from "../../../warehouse-location/entities/warehouse-location.entity";
import { ExpertAssessmentSubmissionStatus } from "../../../../common/enums/ExpertAssessmentSubmissionStatus";
import { InspectionReportHistory } from "../../../inspection-reports/entities/inspection-report-history.entity";

@Entity("expert_assessment_submissions_history")
export class AssessmentSubmissionHistory {
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

    @Column({ type: 'uuid', })
    assessmentId: string;

    @ManyToOne(() => ExpertAssessment, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'assessmentId' })
    assessment: ExpertAssessment;

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

    @Column({ type: 'uuid', nullable: true })
    inspectionReportHistoryId?: string;

    @ManyToOne(() => InspectionReportHistory, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'inspectionReportHistoryId' })
    inspectionReportHistory?: InspectionReportHistory;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => AssessmentDocument, (documentHistory) => documentHistory.submissionHistory)
    documentsHistory: AssessmentDocument[];
}
