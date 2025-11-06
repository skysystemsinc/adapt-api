import { Module } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationApplication } from '../registration-application/entities/registration-application.entity';
import { User } from '../users/entities/user.entity';

@Module({
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
  exports: [AdminDashboardService],
  imports: [TypeOrmModule.forFeature([RegistrationApplication, User])],
})
export class AdminDashboardModule {}

