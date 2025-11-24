import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Assignment, User])],
  controllers: [AssignmentController],
  providers: [AssignmentService],
})
export class AssignmentModule {}
