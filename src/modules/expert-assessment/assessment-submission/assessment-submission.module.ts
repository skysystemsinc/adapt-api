import { Module } from '@nestjs/common';
import { AssessmentSubmissionService } from './assessment-submission.service';
import { AssessmentSubmissionController } from './assessment-submission.controller';

@Module({
  controllers: [AssessmentSubmissionController],
  providers: [AssessmentSubmissionService],
})
export class AssessmentSubmissionModule {}
