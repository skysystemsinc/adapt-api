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
import { AssignmentSectionHistory } from './assignment-section-history.entity';
import { AssignmentSectionFieldStatus } from '../../../../../utilites/enum';

@Entity('assignment_section_fields')
export class AssignmentSectionField {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => AssignmentSection, (s) => s.fields, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assignmentSectionId' })
    assignmentSection: AssignmentSection | null;

    @Column({ nullable: true })
    assignmentSectionId: string | null;

    @ManyToOne(() => AssignmentSectionHistory, (s) => s.fieldsHistory, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assignmentSectionHistoryId' })
    assignmentSectionHistory: AssignmentSectionHistory | null;

    @Column({ nullable: true })
    assignmentSectionHistoryId: string | null;

    @Column({ type: 'varchar' })
    fieldName: string;

    @Column({ type: 'text', nullable: true })
    remarks: string;

    @Column({ type: 'enum', enum: AssignmentSectionFieldStatus, enumName: 'assignment_section_fields_status_enum', default: AssignmentSectionFieldStatus.PENDING })
    status: AssignmentSectionFieldStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}





