import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ReviewEntity } from './entities/review.entity';
import { AssessmentDetailsEntity } from './entities/assessment_details.entity';
import { InspectionReport } from '../../inspection-reports/entities/inspection-report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewEntity, AssessmentDetailsEntity, InspectionReport]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
