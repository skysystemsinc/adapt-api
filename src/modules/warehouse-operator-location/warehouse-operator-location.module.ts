import { Module } from '@nestjs/common';
import { WarehouseOperatorLocationService } from './warehouse-operator-location.service';
import { WarehouseOperatorLocationController } from './warehouse-operator-location.controller';

@Module({
  controllers: [WarehouseOperatorLocationController],
  providers: [WarehouseOperatorLocationService],
})
export class WarehouseOperatorLocationModule {}
