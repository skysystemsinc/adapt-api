import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AssessmentSubSectionService } from './assessment-sub-section.service';
import { AssessmentSubSectionController } from './assessment-sub-section.controller';
import { AssessmentSubSection } from './entities/assessment-sub-section.entity';
import { ExpertAssessment } from '../entities/expert-assessment.entity';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssessmentSubSection, ExpertAssessment]),
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AssessmentSubSectionController],
  providers: [AssessmentSubSectionService],
  exports: [AssessmentSubSectionService],
})
export class AssessmentSubSectionModule {}
