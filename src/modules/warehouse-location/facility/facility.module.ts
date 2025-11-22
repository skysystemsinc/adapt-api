import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacilityService } from './facility.service';
import { FacilityController } from './facility.controller';
import { Facility } from './entities/facility.entity';
import { WarehouseLocation } from '../entities/warehouse-location.entity';

@Module({
  controllers: [FacilityController],
  providers: [FacilityService],
  imports: [
    TypeOrmModule.forFeature([Facility, WarehouseLocation]),
  ],
  exports: [FacilityService],
})
export class FacilityModule {}
