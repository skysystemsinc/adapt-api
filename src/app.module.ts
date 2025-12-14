import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ApplicationTypeModule } from './modules/application-type/application-type.module';
import { FormsModule } from './modules/forms/forms.module';
import { FormSubmissionsModule } from './modules/form-submissions/form-submissions.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { RegistrationApplicationModule } from './modules/registration-application/registration-application.module';
import { RBACModule } from './modules/rbac/rbac.module';
import { DocumentTypeModule } from './modules/document-type/document-type.module';
import { FormRequestsModule } from './modules/form-requests/form-requests.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { SettingsModule } from './modules/settings/settings.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { CommonModule } from './modules/common/common.module';
import { WarehouseAdminModule } from './modules/warehouse-admin/warehouse-admin.module';
import { WarehouseLocationModule } from './modules/warehouse-location/warehouse-location.module';
import { WarehouseLocationAdminModule } from './modules/warehouse-location-admin/warehouse-location-admin.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ExpertAssessmentModule } from './modules/expert-assessment/expert-assessment.module';
import { InspectionReportsModule } from './modules/inspection-reports/inspection-reports.module';
import { WarehouseOperatorLocationModule } from './modules/warehouse-operator-location/warehouse-operator-location.module';
import { DynamicCalculatorModule } from './modules/dynamic-calculator/dynamic-calculator.module';
import { ApplicantModule } from './modules/applicant/applicant.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
    }),
    
    // TypeORM Module
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('database')!,
      inject: [ConfigService],
    }),
    
    // Feature Modules
    UsersModule,
    AuthModule,
    ApplicationTypeModule,
    FormsModule,
    FormSubmissionsModule,
    UploadsModule,
    RegistrationApplicationModule,
    RBACModule,
    DocumentTypeModule,
    FormRequestsModule,
    AdminDashboardModule,
    SettingsModule,
    WarehouseModule,
    CommonModule,
    WarehouseAdminModule,
    WarehouseLocationModule,
    WarehouseLocationAdminModule,
    OrganizationModule,
    ExpertAssessmentModule,
    InspectionReportsModule,
    WarehouseOperatorLocationModule,
    DynamicCalculatorModule,
    ApplicantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
