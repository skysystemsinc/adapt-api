import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocationChecklistEntity } from "../warehouse-location-checklist.entity";
import { WarehouseDocument } from "../../../warehouse/entities/warehouse-document.entity";

@Entity('location_risk_checklist')
export class LocationRiskEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    warehouseOutsideFloodingArea: boolean;

    @Column({ nullable: true })
    warehouseOutsideFloodingAreaFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'warehouseOutsideFloodingAreaFile' })
    warehouseOutsideFloodingAreaDocument?: WarehouseDocument;

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


