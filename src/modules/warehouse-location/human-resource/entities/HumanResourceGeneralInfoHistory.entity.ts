import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { HumanResource } from "./human-resource.entity";
import { WarehouseDocument } from "../../../warehouse/entities/warehouse-document.entity";

@Entity('human_resources_general_info_history')
export class HumanResourceGeneralInfoHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    humanResourceId: string;

    @ManyToOne(() => HumanResource, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'humanResourceId' })
    humanResource: HumanResource;

    @Column({ type: 'varchar', length: 200 })
    fullName: string;

    @Column({ type: 'varchar', length: 200 })
    fathersHusbandsName: string;

    @Column({ type: 'varchar', length: 50 })
    cnicPassport: string;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'photograph' })
    photograph: WarehouseDocument;

    @Column({ type: 'varchar', length: 100 })
    nationality: string;

    @Column({ type: 'date', nullable: true })
    dateOfBirth: Date;

    @Column({ type: 'text' })
    residentialAddress: string;

    @Column({ type: 'text' })
    businessAddress: string;

    @Column({ type: 'varchar', length: 50 })
    telephoneNumber: string;

    @Column({ type: 'varchar', length: 50 })
    mobileNumber: string;

    @Column({ type: 'varchar', length: 200 })
    email: string;

    @Column({ type: 'varchar', length: 100 })
    hrNationalTaxNumber: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}