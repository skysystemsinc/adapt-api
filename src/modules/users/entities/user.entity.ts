import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../rbac/entities/user-role.entity';
import { WarehouseOperatorApplicationRequest } from '../../warehouse/entities/warehouse-operator-application-request.entity';
import { WarehouseLocation } from 'src/modules/warehouse-location/entities/warehouse-location.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ nullable: true })
  passwordResetExpires: Date;

  @Column({ nullable: true, length: 4 })
  otp: string;

  @Column({ nullable: true })
  otpExpires: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  @OneToMany(() => WarehouseOperatorApplicationRequest, (request) => request.user)
  operatorApplicationRequests: WarehouseOperatorApplicationRequest[];

  @OneToMany(() => WarehouseLocation, (warehouseLocation) => warehouseLocation.user)
  warehouseLocations: WarehouseLocation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
