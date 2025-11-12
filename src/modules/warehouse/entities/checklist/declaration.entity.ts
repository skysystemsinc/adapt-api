import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApplicantChecklistEntity } from "../applicant-checklist.entity";

@Entity('declaration_checklist')
export class DeclarationChecklistEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    informationTrueComplete: boolean;

    @Column({ type: 'boolean', default: false })
    authorizeVerification: boolean;

    @ManyToOne(() => ApplicantChecklistEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicantChecklistId' })
    applicantChecklist: ApplicantChecklistEntity;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

