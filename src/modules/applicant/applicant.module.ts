import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ApplicantService } from './applicant.service';
import { ApplicantController } from './applicant.controller';
import { WarehouseLocation } from '../warehouse-location/entities/warehouse-location.entity';
import { WarehouseOperatorApplicationRequest } from '../warehouse/entities/warehouse-operator-application-request.entity';
import { Facility } from '../warehouse-location/facility/entities/facility.entity';
import { CompanyInformation } from '../warehouse/entities/company-information.entity';
import { WarehouseOperator } from '../warehouse/entities/warehouse-operator.entity';
import { WarehouseDocument } from '../warehouse/entities/warehouse-document.entity';
import { Assignment } from '../warehouse/operator/assignment/entities/assignment.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [ApplicantController],
  providers: [ApplicantService],
  imports: [
    TypeOrmModule.forFeature([
      WarehouseLocation,
      WarehouseOperatorApplicationRequest,
      WarehouseOperator,
      WarehouseDocument,
      Facility,
      CompanyInformation,
      Assignment,
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
})
export class ApplicantModule { }
