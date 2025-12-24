import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocationChecklistEntity } from "../warehouse-location-checklist.entity";
import { WarehouseDocument } from "../../../warehouse/entities/warehouse-document.entity";
import { LocationRiskEntity } from "./location-risk.entity";

@Entity('location_risk_checklist_history')
export class LocationRiskHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    locationRiskId: string;

    @ManyToOne(() => LocationRiskEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'locationRiskId' })
    locationRisk: LocationRiskEntity;

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


