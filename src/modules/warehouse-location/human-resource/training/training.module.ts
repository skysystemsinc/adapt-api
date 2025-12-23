import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { Training } from './entities/training.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';
import { ClamAVModule } from '../../../clamav/clamav.module';
import { WarehouseLocationModule } from '../../warehouse-location.module';
import { Assignment } from '../../../warehouse/operator/assignment/entities/assignment.entity';
import { AssignmentSection } from '../../../warehouse/operator/assignment/entities/assignment-section.entity';
import { WarehouseLocation } from '../../entities/warehouse-location.entity';
import { TrainingHistory } from './entities/training-history.entity';

@Module({
  controllers: [TrainingController],
  providers: [TrainingService],
  imports: [
    TypeOrmModule.forFeature([Training, TrainingHistory, HumanResource, WarehouseDocument, WarehouseLocation, Assignment, AssignmentSection]),
    ClamAVModule,
    forwardRef(() => WarehouseLocationModule),
  ],
  exports: [TrainingService],
})
export class TrainingModule {}
