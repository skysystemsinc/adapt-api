import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { AssignmentSection } from './assignment-section.entity';
import { AssignmentSectionField } from './assignment-section-field.entity';
import { AssignmentSectionHistory } from './assignment-section-history.entity';
import { AssignmentSectionFieldStatus } from '../../../../../utilites/enum';

@Entity('assignment_section_fields_history')
export class AssignmentSectionFieldHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true })
    assignmentSectionFieldId: string | null;

    @ManyToOne(() => AssignmentSectionField, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assignmentSectionFieldId' })
    assignmentSectionField: AssignmentSectionField | null;

    @Column({ nullable: true })
    assignmentSectionId: string | null;

    @ManyToOne(() => AssignmentSection, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assignmentSectionId' })
    assignmentSection: AssignmentSection | null;

    @Column({ nullable: true })
    assignmentSectionHistoryId: string | null;

    @ManyToOne(() => AssignmentSectionHistory, (s) => s.fieldsHistory, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assignmentSectionHistoryId' })
    assignmentSectionHistory: AssignmentSectionHistory | null;
    
    @Column({ type: 'varchar' })
    fieldName: string;

    @Column({ type: 'text', nullable: true })
    remarks: string;

    @Column({ type: 'enum', enum: AssignmentSectionFieldStatus, enumName: 'assignment_section_fields_history_status_enum' })
    status: AssignmentSectionFieldStatus;

    @Column({ default: false })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

