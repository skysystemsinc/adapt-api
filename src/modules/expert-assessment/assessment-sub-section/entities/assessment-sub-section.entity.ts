import { ExpertAssessment } from "../../entities/expert-assessment.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('assessment_sub_sections')
export class AssessmentSubSection {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    assessmentId: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'int', default: 0 })
    order: number;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => ExpertAssessment, (assessment) => assessment.subSections, {
        onDelete: 'CASCADE',
    })

    @JoinColumn({ name: 'assessmentId' })
    assessment: ExpertAssessment;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
