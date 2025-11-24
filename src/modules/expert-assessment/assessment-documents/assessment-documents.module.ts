import { Module } from '@nestjs/common';
import { AssessmentDocumentsService } from './assessment-documents.service';
import { AssessmentDocumentsController } from './assessment-documents.controller';

@Module({
  controllers: [AssessmentDocumentsController],
  providers: [AssessmentDocumentsService],
})
export class AssessmentDocumentsModule {}
