import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WeighingsService } from './weighings.service';
import { WeighingsController } from './weighings.controller';
import { Weighing } from './entities/weighing.entity';
import { WarehouseLocation } from '../entities/warehouse-location.entity';
import { WarehouseDocument } from '../../warehouse/entities/warehouse-document.entity';
import { ClamAVModule } from '../../clamav/clamav.module';
import { WarehouseModule } from 'src/modules/warehouse/warehouse.module';
import { AssignmentSection } from '../../warehouse/operator/assignment/entities/assignment-section.entity';
import { Assignment } from '../../warehouse/operator/assignment/entities/assignment.entity';

@Module({
  controllers: [WeighingsController],
  providers: [WeighingsService],
  imports: [
    TypeOrmModule.forFeature([Weighing, WarehouseLocation, WarehouseDocument, Assignment, AssignmentSection]),
    forwardRef(() => WarehouseModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    ClamAVModule,
  ],
  exports: [WeighingsService],
})
export class WeighingsModule {}
