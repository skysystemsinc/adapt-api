import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SettingsService } from './settings.service';
import { SettingsController, SettingsAdminController } from './settings.controller';
import { SettingsDownloadController } from './self-assessment.controller';
import { Setting } from './entities/setting.entity';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Setting]),
    RBACModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SettingsController, SettingsAdminController, SettingsDownloadController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}

