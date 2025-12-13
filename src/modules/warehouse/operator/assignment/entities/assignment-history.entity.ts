import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../../../users/entities/user.entity';
import { WarehouseOperatorApplicationRequest } from '../../../../warehouse/entities/warehouse-operator-application-request.entity';
import { WarehouseLocation } from '../../../../warehouse-location/entities/warehouse-location.entity';
import { InspectionReport } from '../../../../inspection-reports/entities/inspection-report.entity';
import { Assignment, AssignmentStatus, AssignmentLevel } from './assignment.entity';

@Entity('assignment_history')
export class AssignmentHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    assignmentId: string;

    @ManyToOne(() => Assignment, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assignmentId' })
    assignment: Assignment;

    @Column({ type: 'uuid', nullable: true })
    parentAssignmentId: string | null;

    @ManyToOne(() => Assignment, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'parentAssignmentId' })
    parentAssignment: Assignment | null;

    @Column({ nullable: true })
    applicationId: string;

    @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationId' })
    application: WarehouseOperatorApplicationRequest;

    @Column({ nullable: true })
    applicationLocationId: string;

    @ManyToOne(() => WarehouseLocation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationLocationId' })
    applicationLocation: WarehouseLocation;

    @Column({ nullable: true })
    assignedBy: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assignedBy' })
    assignedByUser: User;

    @Column({ nullable: true })
    assignedTo: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assignedTo' })
    assignedToUser: User;

    @Column({ type: 'enum', enum: AssignmentLevel })
    level: AssignmentLevel;

    @Column({ nullable: true })
    assessmentId: string;

    @ManyToOne(() => InspectionReport, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assessmentId' })
    assessment: InspectionReport;

    @Column({
        type: 'enum',
        enum: AssignmentStatus,
    })
    status: AssignmentStatus;

    @Column({ default: false })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

