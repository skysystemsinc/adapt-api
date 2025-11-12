import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApplicantChecklistEntity } from "../applicant-checklist.entity";
import { WarehouseDocument } from "../warehouse-document.entity";

@Entity('financial_soundness_checklist')
export class FinancialSoundnessChecklistEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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
    applicantChecklist: ApplicantChecklistEntity;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

