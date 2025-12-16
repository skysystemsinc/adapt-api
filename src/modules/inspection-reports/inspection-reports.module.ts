import { Module } from '@nestjs/common';
import { InspectionReportsService } from './inspection-reports.service';
import { InspectionReportsController } from './inspection-reports.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionReport } from './entities/inspection-report.entity';
import { AssessmentSubmission } from '../expert-assessment/assessment-submission/entities/assessment-submission.entity';
import { AssessmentDocument } from '../expert-assessment/assessment-documents/entities/assessment-document.entity';
import { AssessmentSubSection } from '../expert-assessment/assessment-sub-section/entities/assessment-sub-section.entity';
import { ExpertAssessment } from '../expert-assessment/entities/expert-assessment.entity';
import { ReviewEntity } from '../warehouse/review/entities/review.entity';
import { WarehouseOperatorApplicationRequest } from '../warehouse/entities/warehouse-operator-application-request.entity';
import { WarehouseLocation } from '../warehouse-location/entities/warehouse-location.entity';
import { AuthModule } from '../auth/auth.module';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionReport, AssessmentSubmission, AssessmentDocument, AssessmentSubSection, ExpertAssessment, ReviewEntity, WarehouseOperatorApplicationRequest, WarehouseLocation]),
    ConfigModule,
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    RBACModule,
  ],
  controllers: [InspectionReportsController],
  providers: [InspectionReportsService],
  exports: [InspectionReportsService],
})
export class InspectionReportsModule {}
