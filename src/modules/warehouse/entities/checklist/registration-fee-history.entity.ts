import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApplicantChecklistEntity } from "../applicant-checklist.entity";
import { WarehouseDocument } from "../warehouse-document.entity";
import { RegistrationFeeChecklistEntity } from "./registration-fee.entity";
    
@Entity('registration_fee_checklist_history')
export class RegistrationFeeChecklistHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    registrationFeeChecklistId: string;

    @ManyToOne(() => RegistrationFeeChecklistEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'registrationFeeChecklistId' })
    registrationFeeChecklist: RegistrationFeeChecklistEntity;

    @Column({ nullable: true })
    bankPaymentSlip?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'bankPaymentSlip' })
    bankPaymentSlipDocument?: WarehouseDocument;

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

