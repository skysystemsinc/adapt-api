import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AuthorizedSignatory } from './authorized-signatories.entity';

export enum WarehouseOperatorApplicationStatus {
  PENDING = 'PENDING',
  IN_PROCESS = 'IN_PROCESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  RESUBMITTED = 'RESUBMITTED'
}

@Entity('warehouse_operator_application_request')
export class WarehouseOperatorApplicationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  applicationId: string;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text', nullable: true })
  applicationType: string;

  @OneToMany(() => AuthorizedSignatory, (signatory) => signatory.warehouseOperatorApplicationRequest)
  authorizedSignatories: AuthorizedSignatory[];

  @Column({
    type: 'enum',
    enum: WarehouseOperatorApplicationStatus,
    default: WarehouseOperatorApplicationStatus.PENDING,
  })
  status: WarehouseOperatorApplicationStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

