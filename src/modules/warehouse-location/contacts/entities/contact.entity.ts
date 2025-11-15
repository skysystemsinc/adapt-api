import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";

@Entity('contacts')
export class Contact {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    warehouseLocationId: string;

    @Column({ type: 'varchar', length: 200 })
    nameOfAuthorizedContact: string;

    @Column({ type: 'varchar', length: 200 })
    contactEmail: string;

    @Column({ type: 'varchar', length: 100 })
    uniqueBorrowerCode: string;

    @Column({ type: 'varchar', length: 50 })
    landlineContact: string;

    @Column({ type: 'varchar', length: 50 })
    primaryContact: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => WarehouseLocation, (warehouse) => warehouse.contacts)
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation: WarehouseLocation;
}
