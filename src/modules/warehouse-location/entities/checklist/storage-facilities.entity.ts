import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocationChecklistEntity } from "../warehouse-location-checklist.entity";
import { WarehouseDocument } from "../../../warehouse/entities/warehouse-document.entity";

@Entity('storage_facilities_checklist')
export class StorageFacilitiesEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    securedDoors: boolean;

    @Column({ nullable: true })
    securedDoorsFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'securedDoorsFile' })
    securedDoorsDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    plasteredFlooring: boolean;

    @Column({ nullable: true })
    plasteredFlooringFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'plasteredFlooringFile' })
    plasteredFlooringDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    plasteredWalls: boolean;

    @Column({ nullable: true })
    plasteredWallsFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'plasteredWallsFile' })
    plasteredWallsDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    intactCeiling: boolean;

    @Column({ nullable: true })
    intactCeilingFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'intactCeilingFile' })
    intactCeilingDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    functionalWindows: boolean;

    @Column({ nullable: true })
    functionalWindowsFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'functionalWindowsFile' })
    functionalWindowsDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    protectiveNetting: boolean;

    @Column({ nullable: true })
    protectiveNettingFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'protectiveNettingFile' })
    protectiveNettingDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    functionalExhaustFans: boolean;

    @Column({ nullable: true })
    functionalExhaustFansFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'functionalExhaustFansFile' })
    functionalExhaustFansDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    freeFromPests: boolean;

    @Column({ nullable: true })
    freeFromPestsFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'freeFromPestsFile' })
    freeFromPestsDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    fireSafetyMeasures: boolean;

    @Column({ nullable: true })
    fireSafetyMeasuresFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'fireSafetyMeasuresFile' })
    fireSafetyMeasuresDocument?: WarehouseDocument;

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


