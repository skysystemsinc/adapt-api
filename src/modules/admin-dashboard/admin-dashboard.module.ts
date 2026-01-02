import { Module } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationApplication } from '../registration-application/entities/registration-application.entity';
import { User } from '../users/entities/user.entity';
import { WarehouseLocation } from '../warehouse-location/entities/warehouse-location.entity';
import { WarehouseOperatorApplicationRequest } from '../warehouse/entities/warehouse-operator-application-request.entity';
import { WarehouseOperator } from '../warehouse/entities/warehouse-operator.entity';
import { WarehouseDocument } from '../warehouse/entities/warehouse-document.entity';
import { Assignment } from '../warehouse/operator/assignment/entities/assignment.entity';
import { WarehouseOperatorLocation } from '../warehouse-operator-location/entities/warehouse-operator-location.entity';

@Module({
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
  exports: [AdminDashboardService],
  imports: [
    TypeOrmModule.forFeature([
      RegistrationApplication,
      User,
      WarehouseLocation,
      WarehouseOperatorApplicationRequest,
      WarehouseOperator,
      WarehouseDocument,
      Assignment,
      WarehouseOperatorLocation,
    ]),
  ],
})
export class AdminDashboardModule {}

