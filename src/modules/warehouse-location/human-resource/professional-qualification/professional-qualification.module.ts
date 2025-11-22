import { Module } from '@nestjs/common';
import { ProfessionalQualificationService } from './professional-qualification.service';
import { ProfessionalQualificationController } from './professional-qualification.controller';

@Module({
  controllers: [ProfessionalQualificationController],
  providers: [ProfessionalQualificationService],
})
export class ProfessionalQualificationModule {}
