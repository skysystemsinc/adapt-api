import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicQualificationService } from './academic-qualification.service';
import { AcademicQualificationController } from './academic-qualification.controller';
import { AcademicQualification } from './entities/academic-qualification.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';

@Module({
  controllers: [AcademicQualificationController],
  providers: [AcademicQualificationService],
  imports: [
    TypeOrmModule.forFeature([AcademicQualification, HumanResource, WarehouseDocument]),
  ],
  exports: [AcademicQualificationService],
})
export class AcademicQualificationModule {}
