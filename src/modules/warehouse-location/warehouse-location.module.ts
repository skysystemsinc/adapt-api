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
import { HumanResourceModule } from './human-resource/human-resource.module';

@Module({
  controllers: [WarehouseLocationController],
  providers: [WarehouseLocationService],
  imports: [
    TypeOrmModule.forFeature([WarehouseLocation]),
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
    HumanResourceModule,
  ],
})
export class WarehouseLocationModule {}
