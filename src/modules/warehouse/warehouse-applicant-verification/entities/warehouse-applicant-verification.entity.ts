import { ApprovalStatus } from "../../../../common/enums/ApprovalStatus";
import { EntityType } from "../../../../common/enums/WarehouseApplicantEntityType";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('warehouse_applicant_verifications')
export class WarehouseApplicantVerification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    entityId: number;

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
    approvedBy: number;

    @Column({ nullable: true })
    rejectedBy: number;

    @Column({ type: 'timestamp', nullable: true })
    approvedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    rejectedAt: Date;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
