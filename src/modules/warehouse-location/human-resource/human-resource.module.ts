import { Module } from '@nestjs/common';
import { HumanResourceService } from './human-resource.service';
import { HumanResourceController } from './human-resource.controller';
import { AcademicQualificationModule } from './academic-qualification/academic-qualification.module';
import { ProfessionalQualificationModule } from './professional-qualification/professional-qualification.module';
import { TrainingModule } from './training/training.module';
import { ProfessionalExperienceModule } from './professional-experience/professional-experience.module';

@Module({
  controllers: [HumanResourceController],
  providers: [HumanResourceService],
  imports: [AcademicQualificationModule, ProfessionalQualificationModule, TrainingModule, ProfessionalExperienceModule],
})
export class HumanResourceModule {}
