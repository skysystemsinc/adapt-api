import { Module } from '@nestjs/common';
import { JurisdictionService } from './jurisdiction.service';
import { JurisdictionController } from './jurisdiction.controller';

@Module({
  controllers: [JurisdictionController],
  providers: [JurisdictionService],
})
export class JurisdictionModule {}
