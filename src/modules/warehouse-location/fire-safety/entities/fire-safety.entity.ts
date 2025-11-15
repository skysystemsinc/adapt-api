import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";

@Entity('fire_safeties')
export class FireSafety {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    warehouseLocationId: string;

    @Column({ type: 'varchar', length: 50 })
    fireExtinguishers: string;

    @Column({ type: 'varchar', length: 50 })
    fireBuckets: string;

    @Column({ type: 'varchar', length: 100 })
    waterArrangements: string;

    @Column({ type: 'varchar', length: 100 })
    fireSafetyAlarms: string;

    @Column({ type: 'text', nullable: true })
    otherFireSafetyMeasures: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => WarehouseLocation, (warehouse) => warehouse.fireSafeties)
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation: WarehouseLocation;
}
