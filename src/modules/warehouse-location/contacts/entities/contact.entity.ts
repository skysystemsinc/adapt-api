import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";

@Entity('contact')
export class Contact {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    warehouseLocationId: string;

    @Column({ type: 'varchar', length: 200 })
    name: string;

    @Column({ type: 'varchar', length: 200 })
    email: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    phoneNumber?: string;

    @Column({ type: 'varchar', length: 50 })
    mobileNumber: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => WarehouseLocation, (warehouse) => warehouse.contact)
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation: WarehouseLocation;
}
