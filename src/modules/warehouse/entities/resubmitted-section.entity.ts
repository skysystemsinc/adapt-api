import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { WarehouseOperatorApplicationRequest } from './warehouse-operator-application-request.entity';
import { WarehouseLocation } from '../../warehouse-location/entities/warehouse-location.entity';
import { AssignmentSection } from '../operator/assignment/entities/assignment-section.entity';

@Entity('resubmitted_sections')
export class ResubmittedSectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  applicationId: string;

  @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  application: WarehouseOperatorApplicationRequest;

  @Column({ nullable: true })
  warehouseLocationId: string;

  @ManyToOne(() => WarehouseLocation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouseLocationId' })
  locationApplication: WarehouseLocation;

  @Column({ nullable: true })
  assignmentSectionId: string;

  @ManyToOne(() => AssignmentSection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignmentSectionId' })
  assignmentSection: AssignmentSection;

  @Column({ type: 'varchar' })
  sectionType: string;

  @Column({ type: 'uuid', nullable: true })
  resourceId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

