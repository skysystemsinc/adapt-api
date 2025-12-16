import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { Training } from './entities/training.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';
import { ClamAVModule } from '../../../clamav/clamav.module';

@Module({
  controllers: [TrainingController],
  providers: [TrainingService],
  imports: [
    TypeOrmModule.forFeature([Training, HumanResource, WarehouseDocument]),
    ClamAVModule,
  ],
  exports: [TrainingService],
})
export class TrainingModule {}
