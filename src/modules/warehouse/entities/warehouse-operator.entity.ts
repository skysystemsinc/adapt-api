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
import { WarehouseOperatorApplicationRequest } from './warehouse-operator-application-request.entity';

export enum WarehouseOperatorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('warehouse_operators')
export class WarehouseOperator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  applicationId: string;

  @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'applicationId' })
  application: WarehouseOperatorApplicationRequest;

  @Column({
    type: 'enum',
    enum: WarehouseOperatorStatus,
    default: WarehouseOperatorStatus.ACTIVE,
  })
  status: WarehouseOperatorStatus;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  operatorCode: string;

  @Column({ type: 'date', nullable: true })
  approvedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

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

