import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WarehouseOperator } from './warehouse-operator.entity';
import { WarehouseOperatorLocation } from '../../warehouse-operator-location/entities/warehouse-operator-location.entity';


export enum UnlockRequestStatus {
  PENDING = 'PENDING',
  UNLOCKED = 'UNLOCKED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('unlock_requests')
export class UnlockRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  operatorId: string;

  @ManyToOne(() => WarehouseOperator, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operatorId' })
  operator: WarehouseOperator;

  @Column({ nullable: true })
  locationId: string;

  @ManyToOne(() => WarehouseOperatorLocation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'locationId' })
  location: WarehouseOperatorLocation;

  @Column({ nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text', nullable: false })
  remarks: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  bankPaymentSlip: string;

  /**
   * MIME type of the bank payment slip file
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  mimeType: string;

  /**
   * Original filename of the bank payment slip
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  originalFileName: string;

  /**
   * Initialization vector for encrypted files (hex string)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  iv: string;

  /**
   * Authentication tag for encrypted files (hex string)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  authTag: string;

  @Column({
    type: 'enum',
    enum: UnlockRequestStatus,
    default: UnlockRequestStatus.PENDING,
  })
  status: UnlockRequestStatus;

  @Column({ nullable: true })
  reviewedBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewedByUser: User;

  @Column({ type: 'date', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  reviewRemarks: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

