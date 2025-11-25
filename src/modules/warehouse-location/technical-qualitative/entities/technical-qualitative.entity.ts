import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";

@Entity('technical_qualitative')
export class TechnicalQualitative {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    warehouseLocationId: string;

    @Column({ type: 'boolean', default: false })
    laboratoryFacility: boolean;

    @Column({ type: 'boolean', default: false })
    minimumLabEquipmentExist: boolean;

    @Column({ type: 'boolean', default: false })
    equipmentCalibrated: boolean;

    @Column({ type: 'boolean', default: false })
    washroomsExist: boolean;

    @Column({ type: 'boolean', default: false })
    waterAvailability: boolean;

    @Column({ type: 'boolean', default: false })
    officeInternetFacility: boolean;

    @Column({ type: 'boolean', default: false })
    electricityAvailable: boolean;

    @Column({ type: 'boolean', default: false })
    gasAvailable: boolean;

    @Column({ type: 'boolean', default: false })
    generatorAvailable: boolean;

    @Column({ type: 'text', nullable: true })
    otherUtilitiesFacilities?: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => WarehouseLocation, (warehouse) => warehouse.technicalQualitative, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation: WarehouseLocation;
}

