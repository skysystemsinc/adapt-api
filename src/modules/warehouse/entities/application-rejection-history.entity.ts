import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseOperatorApplicationRequest } from "./warehouse-operator-application-request.entity";
import { WarehouseLocation } from "../../warehouse-location/entities/warehouse-location.entity";
import { User } from "../../users/entities/user.entity";


@Entity('application_rejection_history')
export class ApplicationRejectionHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    applicationId: string;

    @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationId' })
    application: WarehouseOperatorApplicationRequest;

    @Column({ nullable: true })
    locationApplicationId: string;

    @ManyToOne(() => WarehouseLocation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'locationApplicationId' })
    locationApplication: WarehouseLocation;

    @Column({ nullable: true })
    rejectionReason: string;

    @Column({ nullable: true })
    rejectionBy: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rejectionBy' })
    rejectionByUser: User;

    @Column({ type: 'jsonb', nullable: true })
    unlockedSections: string[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

