import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ReviewEntity } from './entities/review.entity';
import { AssessmentDetailsEntity } from './entities/assessment_details.entity';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewEntity, AssessmentDetailsEntity]),
    UsersModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
