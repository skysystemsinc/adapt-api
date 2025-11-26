import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocationChecklistEntity } from "../warehouse-location-checklist.entity";
import { WarehouseDocument } from "../../../warehouse/entities/warehouse-document.entity";

@Entity('ownership_legal_documents_checklist')
export class OwnershipLegalDocumentsEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    ownershipDeed: boolean;

    @Column({ nullable: true })
    ownershipDeedFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'ownershipDeedFile' })
    ownershipDeedDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    mutationDeed: boolean;

    @Column({ nullable: true })
    mutationDeedFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'mutationDeedFile' })
    mutationDeedDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    nocNec: boolean;

    @Column({ nullable: true })
    nocNecFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'nocNecFile' })
    nocNecDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    factoryLayout: boolean;

    @Column({ nullable: true })
    factoryLayoutFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'factoryLayoutFile' })
    factoryLayoutDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    leaseAgreement: boolean;

    @Column({ nullable: true })
    leaseAgreementFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'leaseAgreementFile' })
    leaseAgreementDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    propertyWarranty: boolean;

    @Column({ nullable: true })
    propertyWarrantyFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'propertyWarrantyFile' })
    propertyWarrantyDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    agreementUndertaking: boolean;

    @Column({ nullable: true })
    agreementUndertakingFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'agreementUndertakingFile' })
    agreementUndertakingDocument?: WarehouseDocument;

    @ManyToOne(() => WarehouseLocationChecklistEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'warehouseLocationChecklistId' })
    warehouseLocationChecklist: WarehouseLocationChecklistEntity;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}


