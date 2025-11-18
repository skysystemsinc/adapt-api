import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AuthorizedSignatory } from './authorized-signatories.entity';
import { HrEntity } from './hr.entity';
import { CompanyInformation } from './company-information.entity';
import { FinancialInformationEntity } from './financial-information.entity';
import { BankDetails } from './bank-details.entity';
import { ApplicantChecklistEntity } from './applicant-checklist.entity';
import { WarehouseApplicantVerification } from '../warehouse-applicant-verification/entities/warehouse-applicant-verification.entity';

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

  @OneToMany(() => HrEntity, (hr) => hr.application)
  hrs: HrEntity[];

  @OneToOne(() => CompanyInformation, (companyInformation) => companyInformation.warehouseOperatorApplicationRequest)
  companyInformation: CompanyInformation;

  @OneToOne(() => FinancialInformationEntity, (financialInformation) => financialInformation.application)
  financialInformation: FinancialInformationEntity;

  @OneToOne(() => BankDetails, (bankDetails) => bankDetails.application)
  bankDetails: BankDetails;

  @OneToOne(() => ApplicantChecklistEntity, (applicantChecklist) => applicantChecklist.application)
  applicantChecklist: ApplicantChecklistEntity;

  @OneToMany(() => WarehouseApplicantVerification, (verification) => verification.application)
  verifications: WarehouseApplicantVerification[];
  
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

