import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Assignment } from './assignment.entity';
import { AssignmentSection } from './assignment-section.entity';

@Entity('assignment_sections_history')
export class AssignmentSectionHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    assignmentSectionId: string;

    @ManyToOne(() => AssignmentSection, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assignmentSectionId' })
    assignmentSection: AssignmentSection;

    @Column()
    assignmentId: string;

    @ManyToOne(() => Assignment, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assignmentId' })
    assignment: Assignment;

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

