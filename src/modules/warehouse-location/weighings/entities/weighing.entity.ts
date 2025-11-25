import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";
import { WarehouseDocument } from "../../../warehouse/entities/warehouse-document.entity";

@Entity('weighing')
export class Weighing {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    warehouseLocationId: string;

    @Column({ type: 'boolean', default: false })
    weighbridgeAvailable: boolean;

    @Column({ type: 'varchar', length: 200 })
    weighbridgeLocation: string;

    @Column({ type: 'varchar', length: 50 })
    weighbridgeCapacity: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    weighbridgeMakeModel?: string;

    @Column({ type: 'date', nullable: true })
    weighbridgeInstallationDate?: Date | null;

    @Column({ type: 'date', nullable: true })
    weighbridgeCalibrationStatus: Date | null;

    @Column({ type: 'date', nullable: true })
    weighbridgeNextCalibrationDueDate: Date | null;

    @Column({ type: 'varchar', length: 200, nullable: true })
    weighbridgeOwnerOperatorName?: string;

    @Column({ type: 'text', nullable: true })
    weighbridgeAddressLocation?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    weighbridgeDistanceFromFacility?: string;

    // File path will be stored as string
    // @Column({ type: 'varchar', length: 500, nullable: true })
    // weighbridgeCalibrationCertificate?: string;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'weighbridgeCalibrationCertificate' })
    weighbridgeCalibrationCertificate?: WarehouseDocument;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => WarehouseLocation, (warehouse) => warehouse.weighing)
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation: WarehouseLocation;
}
