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
import { AssignmentSection } from './assignment-section.entity';

export enum AssignmentSectionFieldStatus {
    PENDING = 'PENDING',
    IN_PROCESS = 'IN_PROCESS',
    COMPLETED = 'COMPLETED',
    CORRECTIONS_REQUIRED = 'CORRECTIONS_REQUIRED',
    APPROVED = 'APPROVED',
}

@Entity('assignment_section_fields')
export class AssignmentSectionField {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => AssignmentSection, (s) => s.fields, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assignmentSectionId' })
    assignmentSection: AssignmentSection;

    @Column()
    assignmentSectionId: string;

    @Column({ type: 'varchar' })
    fieldName: string;

    @Column({ type: 'text', nullable: true })
    remarks: string;

    @Column({ type: 'enum', enum: AssignmentSectionFieldStatus, default: AssignmentSectionFieldStatus.PENDING })
    status: AssignmentSectionFieldStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}





