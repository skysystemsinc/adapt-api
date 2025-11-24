import { Module } from '@nestjs/common';
import { ProfessionalExperienceService } from './professional-experience.service';
import { ProfessionalExperienceController } from './professional-experience.controller';

@Module({
  controllers: [ProfessionalExperienceController],
  providers: [ProfessionalExperienceService],
})
export class ProfessionalExperienceModule {}
