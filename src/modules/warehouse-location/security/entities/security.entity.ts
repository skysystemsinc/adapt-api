import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";

@Entity('securities')
export class Security {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    warehouseLocationId: string;

    @Column({ type: 'varchar', length: 50 })
    numberOfEntryAndExit: string;

    @Column({ type: 'boolean', default: false })
    compoundWallFencing: boolean;

    @Column({ type: 'varchar', length: 50 })
    guardsDeployed: string;

    @Column({ type: 'varchar', length: 50 })
    NumberOfCameras: string;

    @Column({ type: 'text', nullable: true })
    otherSecurityMeasures: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => WarehouseLocation, (warehouse) => warehouse.securities)
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation: WarehouseLocation;
}
