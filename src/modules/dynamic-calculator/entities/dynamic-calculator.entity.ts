import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Setting } from '../../settings/entities/setting.entity';

@Entity('dynamic_calculator')
export class DynamicCalculator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  warehouseType: string;

  @Column({ type: 'varchar' })
  warehouseCategory: string;

  @Column({ type: 'varchar' })
  province: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  accreditationFee: number;

  @ManyToOne(() => Setting, { nullable: true })
  @JoinColumn({ name: 'salesTaxSettingId' })
  salesTax: Setting | null;

  @Column({ type: 'uuid', nullable: true })
  salesTaxSettingId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salesTaxValue: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

