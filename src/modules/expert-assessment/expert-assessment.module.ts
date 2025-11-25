import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpertAssessmentService } from './expert-assessment.service';
import { ExpertAssessmentController } from './expert-assessment.controller';
import { AssessmentSubmissionModule } from './assessment-submission/assessment-submission.module';
import { AssessmentDocumentsModule } from './assessment-documents/assessment-documents.module';
import { ExpertAssessment } from './entities/expert-assessment.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { AssessmentSubSectionModule } from './assessment-sub-section/assessment-sub-section.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExpertAssessment]),
    AssessmentSubmissionModule,
    AssessmentDocumentsModule,
    forwardRef(() => AuthModule),
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
  controllers: [ExpertAssessmentController],
  providers: [ExpertAssessmentService],
  exports: [ExpertAssessmentService],
})
export class ExpertAssessmentModule { }
