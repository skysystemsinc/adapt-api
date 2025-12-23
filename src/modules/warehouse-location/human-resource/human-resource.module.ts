import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HumanResourceService } from './human-resource.service';
import { HumanResourceController } from './human-resource.controller';
import { AcademicQualificationModule } from './academic-qualification/academic-qualification.module';
import { ProfessionalQualificationModule } from './professional-qualification/professional-qualification.module';
import { TrainingModule } from './training/training.module';
import { ProfessionalExperienceModule } from './professional-experience/professional-experience.module';
import { DeclarationModule } from './declaration/declaration.module';
import { HumanResource } from './entities/human-resource.entity';
import { WarehouseLocation } from '../entities/warehouse-location.entity';
import { WarehouseDocument } from '../../warehouse/entities/warehouse-document.entity';
import { Declaration } from './declaration/entities/declaration.entity';
import { AcademicQualification } from './academic-qualification/entities/academic-qualification.entity';
import { ProfessionalQualification } from './professional-qualification/entities/professional-qualification.entity';
import { Training } from './training/entities/training.entity';
import { ProfessionalExperience } from './professional-experience/entities/professional-experience.entity';
import { ClamAVModule } from '../../clamav/clamav.module';
import { HumanResourceGeneralInfoHistory } from './entities/HumanResourceGeneralInfoHistory.entity';
import { Assignment } from 'src/modules/warehouse/operator/assignment/entities/assignment.entity';
import { AssignmentSection } from 'src/modules/warehouse/operator/assignment/entities/assignment-section.entity';
import { WarehouseLocationModule } from '../warehouse-location.module';

@Module({
  controllers: [HumanResourceController],
  providers: [HumanResourceService],
  imports: [
    TypeOrmModule.forFeature([
      HumanResource,
      WarehouseLocation,
      WarehouseDocument,
      Declaration,
      AcademicQualification,
      ProfessionalQualification,
      Training,
      ProfessionalExperience,
      HumanResourceGeneralInfoHistory,    
      Assignment,                        
      AssignmentSection, 
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    AcademicQualificationModule,
    ProfessionalQualificationModule,
    TrainingModule,
    ProfessionalExperienceModule,
    DeclarationModule,
    ClamAVModule,
    forwardRef(() => WarehouseLocationModule),
  ],
  exports: [HumanResourceService],
})
export class HumanResourceModule {}
