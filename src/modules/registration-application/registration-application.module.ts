import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RegistrationApplicationService } from './registration-application.service';
import { RegistrationApplicationController } from './registration-application.controller';
import { RegistrationApplicationAdminController } from './registration-application-admin.controller';
import { AdminUploadController } from './admin-upload.controller';
import { RegistrationApplication } from './entities/registration-application.entity';
import { RegistrationApplicationDetails } from './entities/registration-application-details.entity';
import { AdminRegistrationDocument } from './entities/admin-registration-document.entity';
import { ApplicationType } from '../application-type/entities/application-type.entity';
import { RBACModule } from '../rbac/rbac.module';
import { UsersModule } from '../users/users.module';
import { Role } from '../rbac/entities/role.entity';
import { FormField } from '../forms/entities/form-field.entity';
import { ClamAVModule } from '../clamav/clamav.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegistrationApplication,
      RegistrationApplicationDetails,
      AdminRegistrationDocument,
      ApplicationType,
      Role,
      FormField,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    RBACModule,
    UsersModule,
    ClamAVModule,
  ],
  controllers: [
    RegistrationApplicationController,
    RegistrationApplicationAdminController,
    AdminUploadController,
  ],
  providers: [RegistrationApplicationService],
  exports: [RegistrationApplicationService],
})
export class RegistrationApplicationModule {}

