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
import { AssignmentSection } from './assignment-section.entity';
import { AssignmentHistory } from './assignment-history.entity';
import { AssignmentSectionFieldHistory } from './assignment-section-field-history.entity';

@Entity('assignment_sections_history')
export class AssignmentSectionHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => AssignmentHistory, (a) => a.sections, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assignmentHistoryId' })
    assignmentHistory: AssignmentHistory | null;

    @Column({ nullable: true })
    assignmentHistoryId: string | null;

    @Column({ type: 'uuid', nullable: true })
    assignmentSectionId?: string | null;

    @ManyToOne(() => AssignmentSection, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assignmentSectionId' })
    assignmentSection: AssignmentSection | null;

    @OneToMany(() => AssignmentSectionFieldHistory, (f) => f.assignmentSectionHistory, { nullable: true, cascade: true })
    fieldsHistory: AssignmentSectionFieldHistory[];

    @Column({ type: 'varchar' })
    sectionType: string;

    @Column({ type: 'uuid', nullable: true })
    resourceId: string | null;

    @Column({ type: 'varchar', nullable: true })
    resourceType: string | null;

    @Column({ default: false })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

