import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";

@Entity('facilities')
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

  @Column({ type: 'json', nullable: true })
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

  @Column({ type: 'int', nullable: true })
  leaseDuration: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => WarehouseLocation, (warehouse) => warehouse.facilities)
  @JoinColumn({ name: 'warehouseLocationId' })
  warehouseLocation: WarehouseLocation;
}
