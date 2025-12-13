import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RecaptchaService } from './services/recaptcha.service';
import { ForgotPasswordRateLimitGuard } from './guards/forgot-password-rate-limit.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RecaptchaService, JwtAuthGuard, ForgotPasswordRateLimitGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}