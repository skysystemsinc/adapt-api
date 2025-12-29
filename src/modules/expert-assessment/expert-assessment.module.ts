import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpertAssessmentService } from './expert-assessment.service';
import { ExpertAssessmentController } from './expert-assessment.controller';
import { ExpertAssessmentRequestsService } from './expert-assessment-requests.service';
import { ExpertAssessmentRequestsController } from './expert-assessment-requests.controller';
import { AssessmentSubmissionModule } from './assessment-submission/assessment-submission.module';
import { AssessmentDocumentsModule } from './assessment-documents/assessment-documents.module';
import { ExpertAssessment } from './entities/expert-assessment.entity';
import { ExpertAssessmentRequest } from './entities/expert-assessment-request.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { AssessmentSubSectionModule } from './assessment-sub-section/assessment-sub-section.module';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExpertAssessment, ExpertAssessmentRequest]),
    AssessmentSubmissionModule,
    AssessmentDocumentsModule,
    forwardRef(() => AuthModule),
    RBACModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    AssessmentSubSectionModule,
  ],
  controllers: [ExpertAssessmentController, ExpertAssessmentRequestsController],
  providers: [ExpertAssessmentService, ExpertAssessmentRequestsService],
  exports: [ExpertAssessmentService, ExpertAssessmentRequestsService],
})
export class ExpertAssessmentModule { }
