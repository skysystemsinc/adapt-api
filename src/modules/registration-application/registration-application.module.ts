import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RegistrationApplicationService } from './registration-application.service';
import { RegistrationApplicationController } from './registration-application.controller';
import { RegistrationApplicationAdminController } from './registration-application-admin.controller';
import { RegistrationApplication } from './entities/registration-application.entity';
import { RegistrationApplicationDetails } from './entities/registration-application-details.entity';
import { ApplicationType } from '../application-type/entities/application-type.entity';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RegistrationApplication, RegistrationApplicationDetails, ApplicationType]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    RBACModule,
  ],
  controllers: [
    RegistrationApplicationController,
    RegistrationApplicationAdminController,
  ],
  providers: [RegistrationApplicationService],
  exports: [RegistrationApplicationService],
})
export class RegistrationApplicationModule {}

