import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { Security } from './entities/security.entity';
import { WarehouseLocation } from '../entities/warehouse-location.entity';

@Module({
  controllers: [SecurityController],
  providers: [SecurityService],
  imports: [
    TypeOrmModule.forFeature([Security, WarehouseLocation]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [SecurityService],
})
export class SecurityModule {}
