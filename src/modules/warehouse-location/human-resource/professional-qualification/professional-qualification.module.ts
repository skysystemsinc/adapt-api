import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfessionalQualificationService } from './professional-qualification.service';
import { ProfessionalQualificationController } from './professional-qualification.controller';
import { ProfessionalQualification } from './entities/professional-qualification.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';
import { ClamAVModule } from '../../../clamav/clamav.module';
import { WarehouseLocationModule } from '../../warehouse-location.module';
import { Assignment } from '../../../warehouse/operator/assignment/entities/assignment.entity';
import { AssignmentSection } from '../../../warehouse/operator/assignment/entities/assignment-section.entity';
import { WarehouseLocation } from '../../entities/warehouse-location.entity';
import { ProfessionalQualificationHistory } from './entities/professional-qualification-history.entity';

@Module({
  controllers: [ProfessionalQualificationController],
  providers: [ProfessionalQualificationService],
  imports: [
    TypeOrmModule.forFeature([ProfessionalQualification, ProfessionalQualificationHistory, HumanResource, WarehouseDocument, WarehouseLocation, Assignment, AssignmentSection]),
    ClamAVModule,
    forwardRef(() => WarehouseLocationModule),
  ],
  exports: [ProfessionalQualificationService],
})
export class ProfessionalQualificationModule {}
