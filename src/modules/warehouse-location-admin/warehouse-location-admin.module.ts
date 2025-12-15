import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WarehouseLocationAdminController } from './warehouse-location-admin.controller';
import { WarehouseLocationAdminService } from './warehouse-location-admin.service';
import { WarehouseLocation } from '../warehouse-location/entities/warehouse-location.entity';
import { User } from '../users/entities/user.entity';
import { Assignment } from '../warehouse/operator/assignment/entities/assignment.entity';
import { RegistrationApplication } from '../registration-application/entities/registration-application.entity';

@Module({
  controllers: [WarehouseLocationAdminController],
  providers: [WarehouseLocationAdminService],
  imports: [
    TypeOrmModule.forFeature([WarehouseLocation, User, Assignment, RegistrationApplication]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class WarehouseLocationAdminModule { }

