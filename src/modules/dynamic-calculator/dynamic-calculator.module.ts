import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicCalculatorService } from './dynamic-calculator.service';
import { DynamicCalculatorAdminController } from './dynamic-calculator-admin.controller';
import { DynamicCalculator } from './entities/dynamic-calculator.entity';
import { Setting } from '../settings/entities/setting.entity';
import { RBACModule } from '../rbac/rbac.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([DynamicCalculator, Setting]),
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
  controllers: [DynamicCalculatorAdminController],
  providers: [DynamicCalculatorService],
  exports: [DynamicCalculatorService],
})
export class DynamicCalculatorModule {}

