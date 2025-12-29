import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApplicantChecklistEntity } from "../applicant-checklist.entity";
import { DeclarationChecklistEntity } from "./declaration.entity";

@Entity('declaration_checklist_history')
export class DeclarationChecklistHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    declarationChecklistId: string;

    @ManyToOne(() => DeclarationChecklistEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'declarationChecklistId' })
    declarationChecklist: DeclarationChecklistEntity;

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

