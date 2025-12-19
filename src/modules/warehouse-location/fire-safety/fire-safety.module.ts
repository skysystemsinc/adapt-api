import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FireSafetyService } from './fire-safety.service';
import { FireSafetyController } from './fire-safety.controller';
import { FireSafety } from './entities/fire-safety.entity';
import { WarehouseLocation } from '../entities/warehouse-location.entity';
import { WarehouseModule } from '../../warehouse/warehouse.module';
import { Assignment } from '../../warehouse/operator/assignment/entities/assignment.entity';
import { AssignmentSection } from '../../warehouse/operator/assignment/entities/assignment-section.entity';

@Module({
  controllers: [FireSafetyController],
  providers: [FireSafetyService],
  imports: [
    TypeOrmModule.forFeature([FireSafety, WarehouseLocation, Assignment, AssignmentSection]),
    forwardRef(() => WarehouseModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [FireSafetyService],
})
export class FireSafetyModule {}
