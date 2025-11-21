import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";

@Entity('weighing')
export class Weighing {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    warehouseLocationId: string;

    @Column({ type: 'boolean', default: false })
    weighingScalesAvailable: boolean;

    @Column({ type: 'boolean', default: false })
    weighbridgeAvailable: boolean;

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
