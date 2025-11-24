import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfessionalQualificationService } from './professional-qualification.service';
import { ProfessionalQualificationController } from './professional-qualification.controller';
import { ProfessionalQualification } from './entities/professional-qualification.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';

@Module({
  controllers: [ProfessionalQualificationController],
  providers: [ProfessionalQualificationService],
  imports: [
    TypeOrmModule.forFeature([ProfessionalQualification, HumanResource, WarehouseDocument]),
  ],
  exports: [ProfessionalQualificationService],
})
export class ProfessionalQualificationModule {}
