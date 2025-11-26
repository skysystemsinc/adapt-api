import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WarehouseLocation } from './warehouse-location.entity';
import { OwnershipLegalDocumentsEntity } from './checklist/ownership-legal-documents.entity';
import { HumanResourcesKeyEntity } from './checklist/human-resources-key.entity';
import { LocationRiskEntity } from './checklist/location-risk.entity';
import { SecurityPerimeterEntity } from './checklist/security-perimeter.entity';
import { InfrastructureUtilitiesEntity } from './checklist/infrastructure-utilities.entity';
import { StorageFacilitiesEntity } from './checklist/storage-facilities.entity';
import { RegistrationFeeChecklistEntity } from '../../warehouse/entities/checklist/registration-fee.entity';
import { DeclarationChecklistEntity } from '../../warehouse/entities/checklist/declaration.entity';

@Entity('warehouse_location_checklist')
export class WarehouseLocationChecklistEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  warehouseLocationId: string;

  @ManyToOne(() => WarehouseLocation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouseLocationId' })
  warehouseLocation: WarehouseLocation;

  @Column({ type: 'uuid', nullable: true })
  ownershipLegalDocumentsId?: string | null;

  @OneToOne(() => OwnershipLegalDocumentsEntity, { nullable: true })
  @JoinColumn({ name: 'ownershipLegalDocumentsId' })
  ownershipLegalDocuments?: OwnershipLegalDocumentsEntity;

  @Column({ type: 'uuid', nullable: true })
  humanResourcesKeyId?: string | null;

  @OneToOne(() => HumanResourcesKeyEntity, { nullable: true })
  @JoinColumn({ name: 'humanResourcesKeyId' })
  humanResourcesKey?: HumanResourcesKeyEntity;

  @Column({ type: 'uuid', nullable: true })
  locationRiskId?: string | null;

  @OneToOne(() => LocationRiskEntity, { nullable: true })
  @JoinColumn({ name: 'locationRiskId' })
  locationRisk?: LocationRiskEntity;

  @Column({ type: 'uuid', nullable: true })
  securityPerimeterId?: string | null;

  @OneToOne(() => SecurityPerimeterEntity, { nullable: true })
  @JoinColumn({ name: 'securityPerimeterId' })
  securityPerimeter?: SecurityPerimeterEntity;

  @Column({ type: 'uuid', nullable: true })
  infrastructureUtilitiesId?: string | null;

  @OneToOne(() => InfrastructureUtilitiesEntity, { nullable: true })
  @JoinColumn({ name: 'infrastructureUtilitiesId' })
  infrastructureUtilities?: InfrastructureUtilitiesEntity;

  @Column({ type: 'uuid', nullable: true })
  storageFacilitiesId?: string | null;

  @OneToOne(() => StorageFacilitiesEntity, { nullable: true })
  @JoinColumn({ name: 'storageFacilitiesId' })
  storageFacilities?: StorageFacilitiesEntity;

  @Column({ type: 'uuid', nullable: true })
  registrationFeeId?: string | null;

  @ManyToOne(() => RegistrationFeeChecklistEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'registrationFeeId' })
  registrationFee?: RegistrationFeeChecklistEntity;

  @Column({ type: 'uuid', nullable: true })
  declarationId?: string | null;

  @ManyToOne(() => DeclarationChecklistEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'declarationId' })
  declaration?: DeclarationChecklistEntity;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

