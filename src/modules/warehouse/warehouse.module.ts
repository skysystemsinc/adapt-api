import { forwardRef, Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { Warehouse } from './entities/warehouse.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WarehouseOperatorApplicationRequest } from './entities/warehouse-operator-application-request.entity';
import { AuthorizedSignatory } from './entities/authorized-signatories.entity';
import { BankDetails } from './entities/bank-details.entity';

@Module({
  controllers: [WarehouseController],
  providers: [WarehouseService],
  imports: [
    TypeOrmModule.forFeature([
      Warehouse,
      WarehouseOperatorApplicationRequest,
      AuthorizedSignatory,
      BankDetails
    ]),
    forwardRef(() => AuthModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [WarehouseService],
})
export class WarehouseModule { }
