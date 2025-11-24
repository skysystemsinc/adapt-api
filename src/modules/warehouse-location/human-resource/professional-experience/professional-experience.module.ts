import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfessionalExperienceService } from './professional-experience.service';
import { ProfessionalExperienceController } from './professional-experience.controller';
import { ProfessionalExperience } from './entities/professional-experience.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';

@Module({
  controllers: [ProfessionalExperienceController],
  providers: [ProfessionalExperienceService],
  imports: [
    TypeOrmModule.forFeature([ProfessionalExperience, HumanResource, WarehouseDocument]),
  ],
  exports: [ProfessionalExperienceService],
})
export class ProfessionalExperienceModule {}
