import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechnicalQualitativeService } from './technical-qualitative.service';
import { TechnicalQualitativeController } from './technical-qualitative.controller';
import { TechnicalQualitative } from './entities/technical-qualitative.entity';
import { WarehouseLocation } from '../entities/warehouse-location.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([TechnicalQualitative, WarehouseLocation]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TechnicalQualitativeController],
  providers: [TechnicalQualitativeService],
  exports: [TechnicalQualitativeService],
})
export class TechnicalQualitativeModule {}

