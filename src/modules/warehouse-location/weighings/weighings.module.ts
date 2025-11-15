import { Module } from '@nestjs/common';
import { WeighingsService } from './weighings.service';
import { WeighingsController } from './weighings.controller';

@Module({
  controllers: [WeighingsController],
  providers: [WeighingsService],
})
export class WeighingsModule {}
