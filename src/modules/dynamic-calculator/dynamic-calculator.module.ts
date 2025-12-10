import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicCalculatorService } from './dynamic-calculator.service';
import { DynamicCalculatorAdminController } from './dynamic-calculator-admin.controller';
import { DynamicCalculator } from './entities/dynamic-calculator.entity';
import { Setting } from '../settings/entities/setting.entity';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DynamicCalculator, Setting]),
    RBACModule,
  ],
  controllers: [DynamicCalculatorAdminController],
  providers: [DynamicCalculatorService],
  exports: [DynamicCalculatorService],
})
export class DynamicCalculatorModule {}

