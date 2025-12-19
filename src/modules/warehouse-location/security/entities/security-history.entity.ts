import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";
import { Security } from "./security.entity";

@Entity('security_history')
export class SecurityHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    securityId: string;

    @ManyToOne(() => Security, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'securityId' })
    security: Security;

    @Column({ type: 'uuid' })
    warehouseLocationId: string;

    @Column({ type: 'varchar', length: 50 })
    guardsDeployed: string;

    @Column({ type: 'varchar', length: 50 })
    NumberOfCameras: string;

    @Column({ type: 'varchar', length: 100 })
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
