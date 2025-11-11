import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { Designation } from './entities/designation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [CommonController],
  providers: [CommonService],
  imports: [TypeOrmModule.forFeature([Designation])],
})
export class CommonModule {}
