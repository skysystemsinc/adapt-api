import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocationChecklistEntity } from "../warehouse-location-checklist.entity";
import { WarehouseDocument } from "../../../warehouse/entities/warehouse-document.entity";

@Entity('security_perimeter_checklist')
export class SecurityPerimeterEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    securedBoundaryWall: boolean;

    @Column({ nullable: true })
    securedBoundaryWallFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'securedBoundaryWallFile' })
    securedBoundaryWallDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    reinforcedBarbedWire: boolean;

    @Column({ nullable: true })
    reinforcedBarbedWireFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'reinforcedBarbedWireFile' })
    reinforcedBarbedWireDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    fullyGated: boolean;

    @Column({ nullable: true })
    fullyGatedFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'fullyGatedFile' })
    fullyGatedDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    securityGuards24x7: boolean;

    @Column({ nullable: true })
    securityGuards24x7File?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'securityGuards24x7File' })
    securityGuards24x7Document?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    cctvCameras: boolean;

    @Column({ nullable: true })
    cctvCamerasFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'cctvCamerasFile' })
    cctvCamerasDocument?: WarehouseDocument;

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


