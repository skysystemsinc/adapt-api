import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WeighingsService } from './weighings.service';
import { WeighingsController } from './weighings.controller';
import { Weighing } from './entities/weighing.entity';
import { WarehouseLocation } from '../entities/warehouse-location.entity';

@Module({
  controllers: [WeighingsController],
  providers: [WeighingsService],
  imports: [
    TypeOrmModule.forFeature([Weighing, WarehouseLocation]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [WeighingsService],
})
export class WeighingsModule {}
