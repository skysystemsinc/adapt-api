import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";
import { Contact } from "./contact.entity";

@Entity('contact_history')
export class ContactHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    contactId: string;

    @ManyToOne(() => Contact, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'contactId' })
    contact: Contact;

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

    @ManyToOne(() => WarehouseLocation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation: WarehouseLocation;
}
