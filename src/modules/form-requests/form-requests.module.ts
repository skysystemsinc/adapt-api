import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormRequestsService } from './form-requests.service';
import { FormRequestsController } from './form-requests.controller';
import { FormRequest } from './entities/form-request.entity';
import { FormFieldRequest } from './entities/form-field-request.entity';
import { Form } from '../forms/entities/form.entity';
import { FormField } from '../forms/entities/form-field.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FormRequest, FormFieldRequest, Form, FormField]),
  ],
  controllers: [FormRequestsController],
  providers: [FormRequestsService],
  exports: [FormRequestsService],
})
export class FormRequestsModule {}

