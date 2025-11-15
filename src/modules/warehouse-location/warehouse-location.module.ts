import { Module } from '@nestjs/common';
import { WarehouseLocationService } from './warehouse-location.service';
import { WarehouseLocationController } from './warehouse-location.controller';
import { FacilityModule } from './facility/facility.module';
import { ContactsModule } from './contacts/contacts.module';
import { JurisdictionModule } from './jurisdiction/jurisdiction.module';
import { SecurityModule } from './security/security.module';
import { FireSafetyModule } from './fire-safety/fire-safety.module';
import { WeighingsModule } from './weighings/weighings.module';
import { HumanResourceModule } from './human-resource/human-resource.module';

@Module({
  controllers: [WarehouseLocationController],
  providers: [WarehouseLocationService],
  imports: [FacilityModule, ContactsModule, JurisdictionModule, SecurityModule, FireSafetyModule, WeighingsModule, HumanResourceModule],
})
export class WarehouseLocationModule {}
