import { Module } from '@nestjs/common';
import { FireSafetyService } from './fire-safety.service';
import { FireSafetyController } from './fire-safety.controller';

@Module({
  controllers: [FireSafetyController],
  providers: [FireSafetyService],
})
export class FireSafetyModule {}
