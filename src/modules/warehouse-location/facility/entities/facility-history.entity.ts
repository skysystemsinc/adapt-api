import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";
import { Facility } from "./facility.entity";

@Entity('facility_history')
export class FacilityHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  facilityId: string;

  @ManyToOne(() => Facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facilityId' })
  facility: Facility;

  @Column({ type: 'uuid' })
  warehouseLocationId: string;

  @Column({ type: 'varchar', length: 200 })
  facilityName: string;

  @Column({ type: 'varchar', length: 100 })
  storageFacilityType: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'varchar', length: 50 })
  numberOfStorageUnits: string;

  @Column({ type: 'varchar', length: 50 })
  individualCapacityPerUnit: string;

  @Column({ type: 'varchar', length: 50 })
  totalCapacity: string;

  @Column({ type: 'varchar', length: 100 })
  storageFacilitiesAppliedFor: string;

  @Column({ type: 'json' })
  produceForAccreditation: string[];

  @Column({ type: 'varchar', length: 50 })
  totalCapacityAppliedFor: string;

  @Column({ type: 'varchar', length: 50 })
  plinthHeight: string;

  @Column({ type: 'varchar', length: 50 })
  length: string;

  @Column({ type: 'varchar', length: 50 })
  width: string;

  @Column({ type: 'varchar', length: 50 })
  height: string;

  @Column({ type: 'varchar', length: 100 })
  ownership: string;

  @Column({ type: 'date', nullable: true })
  leaseDuration: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  borrowerCodeOfPropertyOwner: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => WarehouseLocation, (warehouse) => warehouse.facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouseLocationId' })
  warehouseLocation: WarehouseLocation;
}
