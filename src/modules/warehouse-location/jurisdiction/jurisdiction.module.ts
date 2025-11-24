import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JurisdictionService } from './jurisdiction.service';
import { JurisdictionController } from './jurisdiction.controller';
import { Jurisdiction } from './entities/jurisdiction.entity';
import { WarehouseLocation } from '../entities/warehouse-location.entity';

@Module({
  controllers: [JurisdictionController],
  providers: [JurisdictionService],
  imports: [
    TypeOrmModule.forFeature([Jurisdiction, WarehouseLocation]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [JurisdictionService],
})
export class JurisdictionModule {}
