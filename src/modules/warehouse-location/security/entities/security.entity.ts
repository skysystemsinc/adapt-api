import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";

@Entity('security')
export class Security {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    warehouseLocationId: string;

    @Column({ type: 'varchar', length: 50 })
    guardsDeployed: number;

    @Column({ type: 'varchar', length: 50 })
    NumberOfCameras: number;

    @Column({ type: 'string' })
    otherSecurityMeasures: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => WarehouseLocation, (warehouse) => warehouse.security)
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation: WarehouseLocation;
}
