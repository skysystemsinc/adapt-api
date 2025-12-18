import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfessionalQualificationService } from './professional-qualification.service';
import { ProfessionalQualificationController } from './professional-qualification.controller';
import { ProfessionalQualification } from './entities/professional-qualification.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';
import { ClamAVModule } from '../../../clamav/clamav.module';

@Module({
  controllers: [ProfessionalQualificationController],
  providers: [ProfessionalQualificationService],
  imports: [
    TypeOrmModule.forFeature([ProfessionalQualification, HumanResource, WarehouseDocument]),
    ClamAVModule,
  ],
  exports: [ProfessionalQualificationService],
})
export class ProfessionalQualificationModule {}
