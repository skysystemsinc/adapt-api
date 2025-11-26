import { Module } from '@nestjs/common';
import { WarehouseAdminService } from './warehouse-admin.service';
import { WarehouseAdminController } from './warehouse-admin.controller';
import { WarehouseOperatorApplicationRequest } from '../warehouse/entities/warehouse-operator-application-request.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  controllers: [WarehouseAdminController],
  providers: [WarehouseAdminService],
  imports: [
    TypeOrmModule.forFeature([WarehouseOperatorApplicationRequest, User]),
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
export class WarehouseAdminModule { }
