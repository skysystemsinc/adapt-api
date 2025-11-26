import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocationChecklistEntity } from "../warehouse-location-checklist.entity";
import { WarehouseDocument } from "../../../warehouse/entities/warehouse-document.entity";

@Entity('human_resources_key_checklist')
export class HumanResourcesKeyEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    qcPersonnel: boolean;

    @Column({ nullable: true })
    qcPersonnelFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'qcPersonnelFile' })
    qcPersonnelDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    warehouseSupervisor: boolean;

    @Column({ nullable: true })
    warehouseSupervisorFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'warehouseSupervisorFile' })
    warehouseSupervisorDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    dataEntryOperator: boolean;

    @Column({ nullable: true })
    dataEntryOperatorFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'dataEntryOperatorFile' })
    dataEntryOperatorDocument?: WarehouseDocument;

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

