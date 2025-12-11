import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    OneToOne,
} from 'typeorm';
import { User } from '../../../../users/entities/user.entity';
import { WarehouseOperatorApplicationRequest } from '../../../../warehouse/entities/warehouse-operator-application-request.entity';
import { AssignmentSection } from './assignment-section.entity';
import { WarehouseLocation } from '../../../../warehouse-location/entities/warehouse-location.entity';
import { InspectionReport } from '../../../../inspection-reports/entities/inspection-report.entity';

export enum AssignmentStatus {
    ASSIGNED = 'ASSIGNED',
    IN_PROGRESS = 'IN_PROGRESS',
    SUBMITTED = 'SUBMITTED',
    COMPLETED = 'COMPLETED',
    REJECTED = 'REJECTED',
}

export enum AssignmentLevel {
    OFFICER_TO_HOD = 'OFFICER_TO_HOD',
    HOD_TO_EXPERT = 'HOD_TO_EXPERT',
    EXPERT_TO_HOD = 'EXPERT_TO_HOD',
    HOD_TO_APPLICANT = 'HOD_TO_APPLICANT',
}

@Entity('assignment')
export class Assignment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Assignment, (a) => a.childAssignments, { nullable: true })
    @JoinColumn({ name: 'parentAssignmentId' })
    parentAssignment: Assignment;

    @OneToMany(() => Assignment, (a) => a.parentAssignment)
    childAssignments: Assignment[];

    @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationId' })
    application: WarehouseOperatorApplicationRequest;

    @Column({ nullable: true })
    applicationId: string;

    @Column({ nullable: true })
    applicationLocationId: string;

    @ManyToOne(() => WarehouseLocation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationLocationId' })
    applicationLocation: WarehouseLocation;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assignedBy' })
    assignedByUser: User;

    @Column({ nullable: true })
    assignedBy: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assignedTo' })
    assignedToUser: User;

    @Column({ nullable: true })
    assignedTo: string;

    @OneToMany(() => AssignmentSection, (s) => s.assignment, { cascade: true })
    sections: AssignmentSection[];

    @Column({ type: 'enum', enum: AssignmentLevel })
    level: AssignmentLevel;

    @ManyToOne(() => InspectionReport, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assessmentId' })
    assessment: InspectionReport;

    @Column({ nullable: true })
    assessmentId: string;

    @Column({
        type: 'enum',
        enum: AssignmentStatus,
        default: AssignmentStatus.ASSIGNED,
    })
    status: AssignmentStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}


