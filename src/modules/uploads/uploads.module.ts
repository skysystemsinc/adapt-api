import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { Form } from '../forms/entities/form.entity';
import { FormField } from '../forms/entities/form-field.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Form, FormField])],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}

