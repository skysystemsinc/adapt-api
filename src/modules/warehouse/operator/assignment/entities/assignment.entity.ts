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


