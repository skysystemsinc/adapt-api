import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationApplicationService } from './registration-application.service';
import { RegistrationApplicationController } from './registration-application.controller';
import { RegistrationApplication } from './entities/registration-application.entity';
import { RegistrationApplicationDetails } from './entities/registration-application-details.entity';
import { ApplicationType } from '../application-type/entities/application-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RegistrationApplication, RegistrationApplicationDetails, ApplicationType])],
  controllers: [RegistrationApplicationController],
  providers: [RegistrationApplicationService],
  exports: [RegistrationApplicationService],
})
export class RegistrationApplicationModule {}

