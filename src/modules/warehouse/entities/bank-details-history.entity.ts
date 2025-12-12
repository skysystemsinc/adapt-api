import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WarehouseOperatorApplicationRequest } from './warehouse-operator-application-request.entity';
import { BankDetails } from './bank-details.entity';

export enum StepStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RESUBMITTED = 'RESUBMITTED',
}

@Entity('bank_details_history')
export class BankDetailsHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  applicationId: string;

  @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  application: WarehouseOperatorApplicationRequest;

  @Column({ type: 'uuid', nullable: false })
  bankDetailsId: string;

  @ManyToOne(() => BankDetails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bankDetailsId' })
  bankDetails: BankDetails;

  @Column({ type: 'varchar', length: 200, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  accountTitle: string;

  @Column({ type: 'varchar', length: 24, nullable: false })
  iban: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  accountType: string;
  
  @Column({ type: 'varchar', length: 200, nullable: true })
  branchAddress: string;

  @Column({ type: 'enum', enum: StepStatus, default: StepStatus.DRAFT })
  status: StepStatus;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

