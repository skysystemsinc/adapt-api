import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { Contact } from './entities/contact.entity';
import { WarehouseLocation } from '../entities/warehouse-location.entity';
import { AssignmentSection } from '../../warehouse/operator/assignment/entities/assignment-section.entity';
import { Assignment } from '../../warehouse/operator/assignment/entities/assignment.entity';
import { WarehouseLocationModule } from '../warehouse-location.module';

@Module({
  controllers: [ContactsController],
  providers: [ContactsService],
  imports: [
    TypeOrmModule.forFeature([Contact, WarehouseLocation, Assignment, AssignmentSection]),
    forwardRef(() => WarehouseLocationModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [ContactsService],
})
export class ContactsModule {}
