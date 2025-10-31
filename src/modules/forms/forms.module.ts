import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { FormFieldsController } from './form-fields.controller';
import { Form } from './entities/form.entity';
import { FormField } from './entities/form-field.entity';
import { FormFieldsService } from './form-fields.service';

@Module({
  imports: [TypeOrmModule.forFeature([Form, FormField])],
  controllers: [FormsController, FormFieldsController],
  providers: [FormsService, FormFieldsService],
  exports: [FormsService, FormFieldsService],
})
export class FormsModule {}

