import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApplicantChecklistEntity } from "../applicant-checklist.entity";
import { WarehouseDocument } from "../warehouse-document.entity";
import { FinancialSoundnessChecklistEntity } from "./financial-soundness.entity";

@Entity('financial_soundness_checklist_history')
export class FinancialSoundnessChecklistHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    financialSoundnessChecklistId: string;

    @ManyToOne(() => FinancialSoundnessChecklistEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'financialSoundnessChecklistId' })
    financialSoundnessChecklist: FinancialSoundnessChecklistEntity;

    @Column({ type: 'boolean', default: false })
    auditedFinancialStatements: boolean;

    @Column({ nullable: true })
    auditedFinancialStatementsFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'auditedFinancialStatementsFile' })
    auditedFinancialStatementsDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    positiveNetWorth: boolean;

    @Column({ nullable: true })
    positiveNetWorthFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'positiveNetWorthFile' })
    positiveNetWorthDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    noLoanDefaults: boolean;

    @Column({ nullable: true })
    noLoanDefaultsFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'noLoanDefaultsFile' })
    noLoanDefaultsDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    cleanCreditHistory: boolean;

    @Column({ nullable: true })
    cleanCreditHistoryFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'cleanCreditHistoryFile' })
    cleanCreditHistoryDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    adequateWorkingCapital: boolean;

    @Column({ nullable: true })
    adequateWorkingCapitalFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'adequateWorkingCapitalFile' })
    adequateWorkingCapitalDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    validInsuranceCoverage: boolean;

    @Column({ nullable: true })
    validInsuranceCoverageFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'validInsuranceCoverageFile' })
    validInsuranceCoverageDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    noFinancialFraud: boolean;

    @Column({ nullable: true })
    noFinancialFraudFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'noFinancialFraudFile' })
    noFinancialFraudDocument?: WarehouseDocument;

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

