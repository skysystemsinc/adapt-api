import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";
import { FireSafety } from "./fire-safety.entity";

@Entity('fire_safety_history')
export class FireSafetyHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    fireSafetyId: string;

    @ManyToOne(() => FireSafety, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'fireSafetyId' })
    fireSafety: FireSafety;

    @Column({ type: 'uuid' })
    warehouseLocationId: string;

    @Column({ type: 'varchar', length: 50 })
    fireExtinguishers: string;

    @Column({ type: 'varchar', length: 50 })
    fireBuckets: string;

    @Column({ type: 'boolean', default: false })
    waterArrangements: boolean;

    @Column({ type: 'boolean', default: false })
    fireSafetyAlarms: boolean;

    @Column({ type: 'text', nullable: true })
    otherFireSafetyMeasures: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => WarehouseLocation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation: WarehouseLocation;
}
