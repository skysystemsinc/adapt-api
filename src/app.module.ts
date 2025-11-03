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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
