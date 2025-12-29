import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfessionalExperienceService } from './professional-experience.service';
import { ProfessionalExperienceController } from './professional-experience.controller';
import { ProfessionalExperience } from './entities/professional-experience.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';
import { ClamAVModule } from '../../../clamav/clamav.module';
import { WarehouseLocationModule } from '../../warehouse-location.module';
import { ProfessionalExperienceHistory } from './entities/professional-experience-history.entity';
import { AssignmentSection } from 'src/modules/warehouse/operator/assignment/entities/assignment-section.entity';
import { Assignment } from 'src/modules/warehouse/operator/assignment/entities/assignment.entity';
import { WarehouseLocation } from '../../entities/warehouse-location.entity';
import { WarehouseLocationService } from '../../warehouse-location.service';

@Module({
  controllers: [ProfessionalExperienceController],
  providers: [ProfessionalExperienceService],
  imports: [
    TypeOrmModule.forFeature([ProfessionalExperience, HumanResource, WarehouseDocument, ProfessionalExperienceHistory, Assignment, AssignmentSection, WarehouseLocation]),
    ClamAVModule,
    forwardRef(() => WarehouseLocationModule),
  ],
  exports: [ProfessionalExperienceService],
})
export class ProfessionalExperienceModule {}
