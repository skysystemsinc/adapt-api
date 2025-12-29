import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicQualificationService } from './academic-qualification.service';
import { AcademicQualificationController } from './academic-qualification.controller';
import { AcademicQualification } from './entities/academic-qualification.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';
import { ClamAVModule } from '../../../clamav/clamav.module';
import { WarehouseLocationModule } from '../../warehouse-location.module';
import { Assignment } from '../../../warehouse/operator/assignment/entities/assignment.entity';
import { AssignmentSection } from '../../../warehouse/operator/assignment/entities/assignment-section.entity';
import { WarehouseLocation } from '../../entities/warehouse-location.entity';
import { AcademicQualificationHistory } from './entities/academic-qualification-history.entity';

@Module({
  controllers: [AcademicQualificationController],
  providers: [AcademicQualificationService],
  imports: [
    TypeOrmModule.forFeature([AcademicQualification, AcademicQualificationHistory, HumanResource, WarehouseDocument, WarehouseLocation, Assignment, AssignmentSection]),
    ClamAVModule,
    forwardRef(() => WarehouseLocationModule),
  ],
  exports: [AcademicQualificationService],
})
export class AcademicQualificationModule {}
