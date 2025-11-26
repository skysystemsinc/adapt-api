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
import { AssignmentSectionField } from './assignment-section-field.entity';
import { Assignment } from './assignment.entity';

@Entity('assignment_sections')
export class AssignmentSection {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Assignment, (a) => a.sections, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assignmentId' })
    assignment: Assignment;

    @Column()
    assignmentId: string;

    @Column({ type: 'varchar' })
    sectionType: string;

    @Column({type: 'uuid', nullable: true})
    resourceId?: string | null;

    @Column({type: 'varchar', nullable: true})
    resourceType?: string | null;

    @OneToMany(() => AssignmentSectionField, (f) => f.assignmentSection, { cascade: true })
    fields: AssignmentSectionField[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}




