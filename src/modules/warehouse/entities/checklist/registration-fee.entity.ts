import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApplicantChecklistEntity } from "../applicant-checklist.entity";
import { WarehouseDocument } from "../warehouse-document.entity";

@Entity('registration_fee_checklist')
export class RegistrationFeeChecklistEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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

