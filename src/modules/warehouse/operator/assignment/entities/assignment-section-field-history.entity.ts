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
import { AssignmentSectionField, AssignmentSectionFieldStatus } from './assignment-section-field.entity';

@Entity('assignment_section_fields_history')
export class AssignmentSectionFieldHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    assignmentSectionFieldId: string;

    @ManyToOne(() => AssignmentSectionField, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assignmentSectionFieldId' })
    assignmentSectionField: AssignmentSectionField;

    @Column()
    assignmentSectionId: string;

    @ManyToOne(() => AssignmentSection, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assignmentSectionId' })
    assignmentSection: AssignmentSection;

    @Column({ type: 'varchar' })
    fieldName: string;

    @Column({ type: 'text', nullable: true })
    remarks: string;

    @Column({ type: 'enum', enum: AssignmentSectionFieldStatus })
    status: AssignmentSectionFieldStatus;

    @Column({ default: false })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

