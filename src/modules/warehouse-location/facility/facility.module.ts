import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacilityService } from './facility.service';
import { FacilityController } from './facility.controller';
import { Facility } from './entities/facility.entity';
import { WarehouseLocation } from '../entities/warehouse-location.entity';
import { WarehouseLocationModule } from '../warehouse-location.module';
import { Assignment } from '../../warehouse/operator/assignment/entities/assignment.entity';
import { AssignmentSection } from '../../warehouse/operator/assignment/entities/assignment-section.entity';

@Module({
  controllers: [FacilityController],
  providers: [FacilityService],
  imports: [
    TypeOrmModule.forFeature([Facility, WarehouseLocation, Assignment, AssignmentSection]),
    forwardRef(() => WarehouseLocationModule),
  ],
  exports: [FacilityService],
})
export class FacilityModule {}
