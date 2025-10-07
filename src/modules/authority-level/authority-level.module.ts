import { Module } from '@nestjs/common';
import { AuthorityLevelService } from './authority-level.service';
import { AuthorityLevelController } from './authority-level.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorityLevel } from './entities/authority-level.entity';

@Module({
  controllers: [AuthorityLevelController],
  providers: [AuthorityLevelService],
  imports: [TypeOrmModule.forFeature([AuthorityLevel])],
  exports: [AuthorityLevelService],
})
export class AuthorityLevelModule {}
