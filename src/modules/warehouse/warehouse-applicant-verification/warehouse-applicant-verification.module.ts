import { Module } from '@nestjs/common';
import { WarehouseApplicantVerificationService } from './warehouse-applicant-verification.service';
import { WarehouseApplicantVerificationController } from './warehouse-applicant-verification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseApplicantVerification } from './entities/warehouse-applicant-verification.entity';

@Module({
  controllers: [WarehouseApplicantVerificationController],
  providers: [WarehouseApplicantVerificationService],
  imports: [
    TypeOrmModule.forFeature([WarehouseApplicantVerification]),
  ],
})
export class WarehouseApplicantVerificationModule { }
