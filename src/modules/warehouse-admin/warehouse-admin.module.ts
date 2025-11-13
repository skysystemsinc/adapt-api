import { Module } from '@nestjs/common';
import { WarehouseAdminService } from './warehouse-admin.service';
import { WarehouseAdminController } from './warehouse-admin.controller';
import { WarehouseOperatorApplicationRequest } from '../warehouse/entities/warehouse-operator-application-request.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [WarehouseAdminController],
  providers: [WarehouseAdminService],
  imports: [TypeOrmModule.forFeature([WarehouseOperatorApplicationRequest])],
})
export class WarehouseAdminModule {}
