import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { User } from '../../../../users/entities/user.entity';
import { WarehouseOperatorApplicationRequest } from '../../../../warehouse/entities/warehouse-operator-application-request.entity';
import { WarehouseLocation } from '../../../../warehouse-location/entities/warehouse-location.entity';
import { InspectionReport } from '../../../../inspection-reports/entities/inspection-report.entity';
import { Assignment, AssignmentLevel } from './assignment.entity';
import { AssignmentStatus } from '../../../../../utilites/enum';
import { UnlockRequest } from '../../../../warehouse/entities/unlock-request.entity';
import { AssignmentSectionHistory } from './assignment-section-history.entity';

@Entity('assignment_history')
export class AssignmentHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true })
    assignmentId: string;

    @ManyToOne(() => Assignment, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assignmentId' })
    assignment: Assignment | null;

    @Column({ type: 'uuid', nullable: true })
    parentAssignmentId: string | null;

    @ManyToOne(() => AssignmentHistory, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'parentAssignmentId' })
    parentAssignment: AssignmentHistory | null;

    @OneToMany(() => AssignmentHistory, (a) => a.parentAssignment)
    childAssignments: AssignmentHistory[];

    @Column({ nullable: true })
    applicationId: string;

    @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'applicationId' })
    application: WarehouseOperatorApplicationRequest;

    @Column({ nullable: true })
    applicationLocationId: string;

    @ManyToOne(() => WarehouseLocation, { onDelete: 'SET NULL' })
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

    @Column({ nullable: true })
    unlockRequestId?: string;

    @ManyToOne(() => UnlockRequest, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'unlockRequestId' })
    unlockRequest: UnlockRequest;

    @OneToMany(() => AssignmentSectionHistory, (s) => s.assignmentHistory, { nullable: true, cascade: true })
    sections: AssignmentSectionHistory[];

    // IMPORTANT: enumName is required because this enum was recreated in migration 1766199560953.
    // TypeORM's migration generator has a known bug when enumName is present (crashes with "Cannot read properties of undefined").
    // 
    // SOLUTION: For schema changes to this entity, create migrations MANUALLY instead of using migration:generate.
    // The enumName MUST remain in this file for runtime to work correctly.
    // 
    // See: https://github.com/typeorm/typeorm/issues/XXXXX (TypeORM bug with enumName in migration generator)
    @Column({ type: 'enum', enum: AssignmentLevel, enumName: 'assignment_history_level_enum' })
    level: AssignmentLevel;

    @Column({ nullable: true })
    assessmentId: string;

    @ManyToOne(() => InspectionReport, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assessmentId' })
    assessment: InspectionReport;

    @Column({
        type: 'enum',
        enum: AssignmentStatus,
        enumName: 'assignment_history_status_enum',
    })
    status: AssignmentStatus;

    @Column({ default: false })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

