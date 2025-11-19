import { Module } from '@nestjs/common';
import { WarehouseApplicantVerificationService } from './warehouse-applicant-verification.service';
import { WarehouseApplicantVerificationController } from './warehouse-applicant-verification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseApplicantVerification } from './entities/warehouse-applicant-verification.entity';
import { WarehouseOperatorApplicationRequest } from '../entities/warehouse-operator-application-request.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  controllers: [WarehouseApplicantVerificationController],
  providers: [WarehouseApplicantVerificationService],
  imports: [
    TypeOrmModule.forFeature([WarehouseApplicantVerification, WarehouseOperatorApplicationRequest]),
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
export class WarehouseApplicantVerificationModule { }
