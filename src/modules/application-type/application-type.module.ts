import { Module } from '@nestjs/common';
import { ApplicationTypeService } from './application-type.service';
import { ApplicationTypeController } from './application-type.controller';
import { ApplicationType } from './entities/application-type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
  
@Module({
  controllers: [ApplicationTypeController],
  providers: [ApplicationTypeService],
  imports: [TypeOrmModule.forFeature([ApplicationType])],
  exports: [ApplicationTypeService],
})
export class ApplicationTypeModule {}
