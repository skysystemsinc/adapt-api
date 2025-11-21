import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";

@Entity('facility')
export class Facility {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'varchar', length: 50 })
  leaseDuration: string;

  @Column({ type: 'varchar', length: 100 })
  borrowerCodeOfPropertyOwner: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => WarehouseLocation, (warehouse) => warehouse.facility)
  @JoinColumn({ name: 'warehouseLocationId' })
  warehouseLocation: WarehouseLocation;
}
