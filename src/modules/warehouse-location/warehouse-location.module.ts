import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WarehouseLocationService } from './warehouse-location.service';
import { WarehouseLocationController } from './warehouse-location.controller';
import { WarehouseLocation } from './entities/warehouse-location.entity';
import { FacilityModule } from './facility/facility.module';
import { ContactsModule } from './contacts/contacts.module';
import { JurisdictionModule } from './jurisdiction/jurisdiction.module';
import { SecurityModule } from './security/security.module';
import { FireSafetyModule } from './fire-safety/fire-safety.module';
import { WeighingsModule } from './weighings/weighings.module';
import { TechnicalQualitativeModule } from './technical-qualitative/technical-qualitative.module';
import { HumanResourceModule } from './human-resource/human-resource.module';
import { WarehouseLocationChecklistService } from './warehouse-location-checklist/warehouse-location-checklist.service';
import { WarehouseLocationChecklistController } from './warehouse-location-checklist/warehouse-location-checklist.controller';
import { WarehouseLocationChecklistEntity } from './entities/warehouse-location-checklist.entity';
import { OwnershipLegalDocumentsEntity } from './entities/checklist/ownership-legal-documents.entity';
import { HumanResourcesKeyEntity } from './entities/checklist/human-resources-key.entity';
import { LocationRiskEntity } from './entities/checklist/location-risk.entity';
import { SecurityPerimeterEntity } from './entities/checklist/security-perimeter.entity';
import { InfrastructureUtilitiesEntity } from './entities/checklist/infrastructure-utilities.entity';
import { StorageFacilitiesEntity } from './entities/checklist/storage-facilities.entity';
import { RegistrationFeeChecklistEntity } from '../warehouse/entities/checklist/registration-fee.entity';
import { DeclarationChecklistEntity } from '../warehouse/entities/checklist/declaration.entity';
import { WarehouseDocument } from '../warehouse/entities/warehouse-document.entity';
import { ClamAVModule } from '../clamav/clamav.module';

@Module({
  controllers: [WarehouseLocationController, WarehouseLocationChecklistController],
  providers: [WarehouseLocationService, WarehouseLocationChecklistService],
  imports: [
    TypeOrmModule.forFeature([
      WarehouseLocation,
      WarehouseLocationChecklistEntity,
      OwnershipLegalDocumentsEntity,
      HumanResourcesKeyEntity,
      LocationRiskEntity,
      SecurityPerimeterEntity,
      InfrastructureUtilitiesEntity,
      StorageFacilitiesEntity,
      RegistrationFeeChecklistEntity,
      DeclarationChecklistEntity,
      WarehouseDocument,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => FacilityModule),
    ContactsModule,
    JurisdictionModule,
    SecurityModule,
    FireSafetyModule,
    WeighingsModule,
    TechnicalQualitativeModule,
    HumanResourceModule,
    ClamAVModule,
  ],
})
export class WarehouseLocationModule {}
