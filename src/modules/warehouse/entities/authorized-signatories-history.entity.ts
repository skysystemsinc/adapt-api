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
import { AuthorizedSignatory } from './authorized-signatories.entity';

@Entity('authorized_signatories_history')
export class AuthorizedSignatoryHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  warehouseOperatorApplicationRequestId: string;

  @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouseOperatorApplicationRequestId' })
  warehouseOperatorApplicationRequest: WarehouseOperatorApplicationRequest;

  @Column({ type: 'uuid', nullable: false })
  authorizedSignatoryId: string;

  @ManyToOne(() => AuthorizedSignatory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorizedSignatoryId' })
  authorizedSignatory: AuthorizedSignatory;

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

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

