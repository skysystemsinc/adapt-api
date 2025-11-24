import { Module } from '@nestjs/common';
import { AcademicQualificationService } from './academic-qualification.service';
import { AcademicQualificationController } from './academic-qualification.controller';

@Module({
  controllers: [AcademicQualificationController],
  providers: [AcademicQualificationService],
})
export class AcademicQualificationModule {}
