import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FormSubmissionsService } from './form-submissions.service';
import { FormSubmissionsController } from './form-submissions.controller';
import { FormSubmission } from './entities/form-submission.entity';
import { FormSubmissionValue } from './entities/form-submission-value.entity';
import { Form } from '../forms/entities/form.entity';
import { FormField } from '../forms/entities/form-field.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FormSubmission, FormSubmissionValue, Form, FormField]),
  ],
  providers: [FormSubmissionsService],
  controllers: [FormSubmissionsController],
  exports: [FormSubmissionsService],
})
export class FormSubmissionsModule {}

