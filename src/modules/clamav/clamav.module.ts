import { Module } from '@nestjs/common';
import { ClamAVService } from './clamav.service';
import { ClamAVController } from './clamav.controller';

@Module({
  controllers: [ClamAVController],
  providers: [ClamAVService],
  exports: [ClamAVService],
})
export class ClamAVModule {}

