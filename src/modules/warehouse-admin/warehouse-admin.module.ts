import { Module } from '@nestjs/common';
import { WarehouseAdminService } from './warehouse-admin.service';
import { WarehouseAdminController } from './warehouse-admin.controller';
import { WarehouseOperatorApplicationRequest } from '../warehouse/entities/warehouse-operator-application-request.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

@Module({
  controllers: [WarehouseAdminController],
  providers: [WarehouseAdminService],
  imports: [TypeOrmModule.forFeature([WarehouseOperatorApplicationRequest, User])],
})
export class WarehouseAdminModule {}
