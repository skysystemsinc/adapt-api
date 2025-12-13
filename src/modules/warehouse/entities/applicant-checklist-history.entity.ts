import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseOperatorApplicationRequest } from "./warehouse-operator-application-request.entity";
import { HumanResourcesChecklistEntity } from "./checklist/human-resources.entity";
import { FinancialSoundnessChecklistEntity } from "./checklist/financial-soundness.entity";
import { RegistrationFeeChecklistEntity } from "./checklist/registration-fee.entity";
import { DeclarationChecklistEntity } from "./checklist/declaration.entity";
import { ApplicantChecklistEntity } from "./applicant-checklist.entity";

@Entity('applicant_checklist_history')
export class ApplicantChecklistHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    applicantChecklistId: string;

    @ManyToOne(() => ApplicantChecklistEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicantChecklistId' })
    applicantChecklist: ApplicantChecklistEntity;

    @Column({ nullable: true })
    applicationId: string;

    @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationId' })
    application: WarehouseOperatorApplicationRequest;

    @Column({ nullable: true })
    humanResourcesId: string;

    @OneToOne(() => HumanResourcesChecklistEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'humanResourcesId' })
    humanResources: HumanResourcesChecklistEntity;

    @Column({ nullable: true })
    financialSoundnessId: string;

    @OneToOne(() => FinancialSoundnessChecklistEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'financialSoundnessId' })
    financialSoundness: FinancialSoundnessChecklistEntity;

    @Column({ nullable: true })
    registrationFeeId: string;

    @OneToOne(() => RegistrationFeeChecklistEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'registrationFeeId' })
    registrationFee: RegistrationFeeChecklistEntity;

    @Column({ nullable: true })
    declarationId: string;

    @OneToOne(() => DeclarationChecklistEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'declarationId' })
    declaration: DeclarationChecklistEntity;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

