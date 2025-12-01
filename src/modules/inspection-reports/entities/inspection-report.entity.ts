import { AssessmentSubmission } from "../../expert-assessment/assessment-submission/entities/assessment-submission.entity";
import { User } from "../../users/entities/user.entity";
import { WarehouseLocation } from "../../warehouse-location/entities/warehouse-location.entity";
import { WarehouseOperatorApplicationRequest } from "../../warehouse/entities/warehouse-operator-application-request.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('inspection_reports')
export class InspectionReport {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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

    @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'warehouseOperatorApplicationId' })
    warehouseOperatorApplication?: WarehouseOperatorApplicationRequest;

    @Column({ type: 'uuid', nullable: true })
    warehouseLocationId?: string;

    @ManyToOne(() => WarehouseLocation, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation?: WarehouseLocation;

    @Column({ type: 'uuid', nullable: true })
    createdBy?: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'createdBy' })
    createdByUser?: User;

    @OneToMany(() => AssessmentSubmission, (submission) => submission.inspectionReport)
    assessmentSubmissions: AssessmentSubmission[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}