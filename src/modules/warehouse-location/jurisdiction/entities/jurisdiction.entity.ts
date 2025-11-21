import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";

@Entity('jurisdiction')
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

    @Column({ type: 'varchar', length: 50 })
    numberOfEntryAndExit: string;

    @Column({ type: 'boolean', default: false })
    compoundWallFencing: boolean;

    @Column({ type: 'varchar', length: 50, nullable: true })
    heightOfCompoundWall?: string;

    @Column({ type: 'boolean', default: false })
    compoundWallBarbedFencing?: boolean;

    @Column({ type: 'boolean', default: false })
    damageOnCompoundWall: boolean;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => WarehouseLocation, (warehouse) => warehouse.jurisdiction)
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation: WarehouseLocation;
}
