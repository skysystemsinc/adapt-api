import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { AssessmentSubmission } from "../assessment-submission/entities/assessment-submission.entity";
import { User } from "../../users/entities/user.entity";
import { AssessmentSubSection } from "../assessment-sub-section/entities/assessment-sub-section.entity";

export enum AssessmentCategory {
    FINANCIAL = 'financial',
    HR = 'hr',
    LEGAL = 'legal',
    SECURITY = 'security',
    TECHNICAL = 'technical',
    ECG = 'ecg',
}

@Entity('expert_assessments')
export class ExpertAssessment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({
        type: 'enum',
        enum: AssessmentCategory,
    })
    category: AssessmentCategory;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'uuid', nullable: true })
    createdBy?: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'createdBy' })
    createdByUser?: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => AssessmentSubmission, (submission) => submission.assessment)
    submissions: AssessmentSubmission[];

    @OneToMany(() => AssessmentSubSection, (subSection) => subSection.assessment)
    subSections: AssessmentSubSection[];
}
