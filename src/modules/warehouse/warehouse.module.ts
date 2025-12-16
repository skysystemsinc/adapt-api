import { forwardRef, Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { FinancialInformationService } from './financial-information.service';
import { Warehouse } from './entities/warehouse.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WarehouseOperatorApplicationRequest } from './entities/warehouse-operator-application-request.entity';
import { AuthorizedSignatory } from './entities/authorized-signatories.entity';
import { CompanyInformation } from './entities/company-information.entity';
import { WarehouseDocument } from './entities/warehouse-document.entity';
import { BankDetails } from './entities/bank-details.entity';
import { HrEntity } from './entities/hr.entity';
import { PersonalDetailsEntity } from './entities/hr/personal-details.entity/personal-details.entity';
import { AcademicQualificationsEntity } from './entities/hr/academic-qualifications.entity/academic-qualifications.entity';
import { ProfessionalQualificationsEntity } from './entities/hr/professional-qualifications.entity/professional-qualifications.entity';
import { TrainingsEntity } from './entities/hr/trainings.entity/trainings.entity';
import { ExperienceEntity } from './entities/hr/experience.entity/experience.entity';
import { DeclarationEntity } from './entities/hr/declaration.entity/declaration.entity';
import { Designation } from '../common/entities/designation.entity';
import { FinancialInformationEntity } from './entities/financial-information.entity';
import { AuditReportEntity } from './entities/financial/audit-report.entity';
import { TaxReturnEntity } from './entities/financial/tax-return.entity';
import { BankStatementEntity } from './entities/financial/bank-statement.entity';
import { OthersEntity } from './entities/financial/others.entity';
import { ApplicantChecklistEntity } from './entities/applicant-checklist.entity';
import { HumanResourcesChecklistEntity } from './entities/checklist/human-resources.entity';
import { FinancialSoundnessChecklistEntity } from './entities/checklist/financial-soundness.entity';
import { RegistrationFeeChecklistEntity } from './entities/checklist/registration-fee.entity';
import { DeclarationChecklistEntity } from './entities/checklist/declaration.entity';
import { WarehouseApplicantVerificationModule } from './warehouse-applicant-verification/warehouse-applicant-verification.module';
import { AssignmentModule } from './operator/assignment/assignment.module';
import { ReviewModule } from './review/review.module';
import { WarehouseOperator } from './entities/warehouse-operator.entity';
import { ClamAVModule } from '../clamav/clamav.module';
import { AssignmentSection } from './operator/assignment/entities/assignment-section.entity';
import { Assignment } from './operator/assignment/entities/assignment.entity';
import { AuthorizedSignatoryHistory } from './entities/authorized-signatories-history.entity';
import { BankDetailsHistory } from './entities/bank-details-history.entity';
import { CompanyInformationHistory } from './entities/company-information-history.entity';
import { AcademicQualificationsHistoryEntity } from './entities/hr/academic-qualifications.entity/academic-qualifications-history.entity';
import { PersonalDetailsHistoryEntity } from './entities/hr/personal-details.entity/personal-details-history.entity';
import { ProfessionalQualificationsHistoryEntity } from './entities/hr/professional-qualifications.entity/professional-qualifications-history.entity';
import { TrainingsHistoryEntity } from './entities/hr/trainings.entity/trainings-history.entity';
import { DeclarationHistoryEntity } from './entities/hr/declaration.entity/declaration-history.entity';
import { ExperienceHistoryEntity } from './entities/hr/experience.entity/experience-history.entity';
import { ResubmittedSectionEntity } from './entities/resubmitted-section.entity';
import { RegistrationApplication } from '../registration-application/entities/registration-application.entity';
import { RegistrationApplicationDetails } from '../registration-application/entities/registration-application-details.entity';
import { FormField } from '../forms/entities/form-field.entity';
import { UnlockRequest } from './entities/unlock-request.entity';
import { WarehouseOperatorLocation } from '../warehouse-operator-location/entities/warehouse-operator-location.entity';


@Module({
  controllers: [WarehouseController],
  providers: [WarehouseService, FinancialInformationService],
  imports: [
    TypeOrmModule.forFeature([
      Warehouse,
      WarehouseOperatorApplicationRequest,
      AuthorizedSignatory,
      CompanyInformation,
      WarehouseDocument,
      BankDetails,
      HrEntity,
      PersonalDetailsEntity,
      AcademicQualificationsEntity,
      ProfessionalQualificationsEntity,
      TrainingsEntity,
      ExperienceEntity,
      DeclarationEntity,
      Designation,
      FinancialInformationEntity,
      AuditReportEntity,
      TaxReturnEntity,
      BankStatementEntity,
      OthersEntity,
      ApplicantChecklistEntity,
      HumanResourcesChecklistEntity,
      FinancialSoundnessChecklistEntity,
      RegistrationFeeChecklistEntity,
      DeclarationChecklistEntity,
      WarehouseOperator,
      AssignmentSection,
      Assignment,
      AuthorizedSignatoryHistory,
      BankDetailsHistory,
      CompanyInformationHistory,
      AcademicQualificationsHistoryEntity,
      PersonalDetailsHistoryEntity,
      ProfessionalQualificationsHistoryEntity,
      PersonalDetailsHistoryEntity,
      ProfessionalQualificationsHistoryEntity,
      TrainingsHistoryEntity,
      DeclarationHistoryEntity,
      ExperienceHistoryEntity,
      ResubmittedSectionEntity,
      RegistrationApplication,
      RegistrationApplicationDetails,
      FormField,
      UnlockRequest,
      WarehouseOperatorLocation,
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
    WarehouseApplicantVerificationModule,
    AssignmentModule,
    ReviewModule,
    ClamAVModule,
  ],
  exports: [WarehouseService],
})
export class WarehouseModule { }
