import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { WarehouseLocation } from "../../warehouse-location/entities/warehouse-location.entity";
import { WarehouseOperator } from "../../warehouse/entities/warehouse-operator.entity";

export enum WarehouseOperatorLocationStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
}

@Entity('warehouse_operator_locations')
export class WarehouseOperatorLocation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'uuid', nullable: true })
    warehouseOperatorId: string;

    @ManyToOne(() => WarehouseOperator, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'warehouseOperatorId' })
    warehouseOperator: WarehouseOperator;

    @Column({ type: 'uuid', nullable: true })
    warehouseLocationId: string;

    @ManyToOne(() => WarehouseLocation, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation: WarehouseLocation;

    @Column({
        type: 'enum',
        enum: WarehouseOperatorLocationStatus,
        default: WarehouseOperatorLocationStatus.ACTIVE,
    })
    status: WarehouseOperatorLocationStatus;

    @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
    locationCode: string;

    @Column({ type: 'date', nullable: true })
    approvedAt: Date;

    @Column({ type: 'uuid', nullable: true })
    approvedBy: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    approvedByFullName: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    approvedByDesignation: string;

    @Column({ type: 'date', nullable: true })
    dateOfAssessment: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    accreditationGrade: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'approvedBy' })
    approvedByUser: User;

    @Column({ type: 'date', nullable: true })
    expiryDate: Date;

    @Column({ type: 'text', nullable: true })
    remarks: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
