import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseOperatorLocationService } from './warehouse-operator-location.service';
import { WarehouseOperatorLocationController } from './warehouse-operator-location.controller';
import { WarehouseOperatorLocation } from './entities/warehouse-operator-location.entity';
import { WarehouseDocument } from '../warehouse/entities/warehouse-document.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClamAVModule } from '../clamav/clamav.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WarehouseOperatorLocation, WarehouseDocument]),
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
  controllers: [WarehouseOperatorLocationController],
  providers: [WarehouseOperatorLocationService],
  exports: [WarehouseOperatorLocationService],
})
export class WarehouseOperatorLocationModule { }
