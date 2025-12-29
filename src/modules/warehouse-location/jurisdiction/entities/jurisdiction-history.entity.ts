import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";
import { Jurisdiction } from "./jurisdiction.entity";

@Entity('jurisdiction_history')
export class JurisdictionHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    jurisdictionId: string;

    @ManyToOne(() => Jurisdiction, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'jurisdictionId' })
    jurisdiction: Jurisdiction;

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

    @ManyToOne(() => WarehouseLocation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation: WarehouseLocation;
}
