import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { WarehouseOperatorApplicationRequest } from './warehouse-operator-application-request.entity';
import { WarehouseLocation } from '../../warehouse-location/entities/warehouse-location.entity';
import { AssignmentSectionHistory } from '../operator/assignment/entities/assignment-section-history.entity';

@Entity('resubmitted_sections_history')
export class ResubmittedSectionHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  applicationId: string | null;

  @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'applicationId' })
  application: WarehouseOperatorApplicationRequest | null;

  @Column({ nullable: true })
  warehouseLocationId: string | null;

  @ManyToOne(() => WarehouseLocation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'warehouseLocationId' })
  locationApplication: WarehouseLocation | null;

  @Column({ nullable: true })
  assignmentSectionHistoryId: string | null;

  @ManyToOne(() => AssignmentSectionHistory, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignmentSectionHistoryId' })
  assignmentSectionHistory: AssignmentSectionHistory | null;

  @Column({ type: 'varchar' })
  sectionType: string;

  @Column({ type: 'uuid', nullable: true })
  resourceId?: string | null;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

