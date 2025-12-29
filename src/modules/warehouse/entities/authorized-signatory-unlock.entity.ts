import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UnlockRequest } from './unlock-request.entity';
import { AuthorizedSignatory } from './authorized-signatories.entity';

export enum UnlockUpdateStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('authorized_signatory_unlock_updates')
export class AuthorizedSignatoryUnlockUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  unlockRequestId: string;

  @ManyToOne(() => UnlockRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unlockRequestId' })
  unlockRequest: UnlockRequest;

  @Column({ type: 'uuid', nullable: false })
  authorizedSignatoryId: string;

  @ManyToOne(() => AuthorizedSignatory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorizedSignatoryId' })
  authorizedSignatory: AuthorizedSignatory;

  // Store the updated values
  @Column({ type: 'varchar', length: 200, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  authorizedSignatoryName: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  cnic: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  passport: string;

  @Column({ type: 'date', nullable: false })
  issuanceDateOfCnic: Date;

  @Column({ type: 'date', nullable: false })
  expiryDateOfCnic: Date;
  
  @Column({ type: 'text', nullable: false })
  mailingAddress: string;
  
  @Column({ type: 'varchar', length: 100, nullable: false })
  city: string;
  
  @Column({ type: 'varchar', length: 100, nullable: false })
  country: string;
  
  @Column({ type: 'varchar', length: 10, nullable: false })
  postalCode: string;
  
  @Column({ type: 'varchar', length: 100, nullable: false })
  designation: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  mobileNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  landlineNumber: string;

  @Column({
    type: 'enum',
    enum: UnlockUpdateStatus,
    default: UnlockUpdateStatus.PENDING,
  })
  status: UnlockUpdateStatus;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ type: 'date', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  reviewRemarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}