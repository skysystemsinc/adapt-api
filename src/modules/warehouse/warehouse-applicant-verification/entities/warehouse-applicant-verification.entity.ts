import { User } from "../../../users/entities/user.entity";
import { ApprovalStatus } from "../../../../common/enums/ApprovalStatus";
import { EntityType } from "../../../../common/enums/WarehouseApplicantEntityType";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('warehouse_applicant_verifications')
export class WarehouseApplicantVerification {
    @PrimaryGeneratedColumn('uuid')
    @Index()
    id: string;

    @Column({ nullable: true, type: 'uuid' })
    entityId?: string | null;

    @Column({
        type: 'enum',
        enum: EntityType,
    })
    entityType: EntityType;

    @Column()
    fieldKey: string;

    @Column({ type: 'text', nullable: true })
    fieldValue: string;

    @Column({
        type: 'enum',
        enum: ApprovalStatus,
        default: ApprovalStatus.PENDING,
    })
    status: ApprovalStatus;

    @Column({ type: 'text', nullable: true })
    remarks: string;

    @Column({ nullable: true })
    approvedBy?: string | null;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'approvedBy' })
    approvedByUser?: User | null;

    @Column({ nullable: true })
    rejectedBy?: string | null;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rejectedBy' })
    rejectedByUser?: User | null;

    @Column({ type: 'timestamp', nullable: true })
    approvedAt?: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    rejectedAt?: Date | null;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
