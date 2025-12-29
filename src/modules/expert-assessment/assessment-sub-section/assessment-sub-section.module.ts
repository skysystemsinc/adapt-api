import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AssessmentSubSectionService } from './assessment-sub-section.service';
import { AssessmentSubSectionController } from './assessment-sub-section.controller';
import { AssessmentSubSectionRequestsService } from './assessment-sub-section-requests.service';
import { AssessmentSubSectionRequestsController } from './assessment-sub-section-requests.controller';
import { AssessmentSubSection } from './entities/assessment-sub-section.entity';
import { AssessmentSubSectionRequest } from './entities/assessment-sub-section-request.entity';
import { ExpertAssessment } from '../entities/expert-assessment.entity';
import { AuthModule } from '../../auth/auth.module';
import { RBACModule } from '../../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssessmentSubSection, AssessmentSubSectionRequest, ExpertAssessment]),
    AuthModule,
    RBACModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AssessmentSubSectionController, AssessmentSubSectionRequestsController],
  providers: [AssessmentSubSectionService, AssessmentSubSectionRequestsService],
  exports: [AssessmentSubSectionService, AssessmentSubSectionRequestsService],
})
export class AssessmentSubSectionModule {}
