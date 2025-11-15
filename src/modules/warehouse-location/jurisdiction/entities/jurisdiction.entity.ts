import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";

@Entity('jurisdictions')
export class Jurisdiction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    warehouseLocationId: string;

    @Column({ type: 'varchar', length: 200 })
    jurisdictionalPoliceStationName: string;

    @Column({ type: 'varchar', length: 50 })
    policeStationDistance: string;

    @Column({ type: 'varchar', length: 200 })
    nearestFireStationName: string;

    @Column({ type: 'varchar', length: 50 })
    fireStationDistance: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => WarehouseLocation, (warehouse) => warehouse.jurisdictions)
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation: WarehouseLocation;
}
