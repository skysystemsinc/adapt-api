import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) { }

  async assign(applicationId: string, createAssignmentDto: CreateAssignmentDto, assignedById: string) {
    const user = await this.userRepository.findOne({
      where: { id: assignedById },
      relations: ['userRoles.role'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // TRANSACTION START
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Create assignment
      const assignment = transactionalEntityManager.create(Assignment, {
        applicationId,
        assignedBy: assignedById,
        assignedToUser: { id: createAssignmentDto.assignedTo },
        level: createAssignmentDto.level,
        sections: createAssignmentDto.sections.map((section) => ({
          sectionType: section.sectionType,
          fields: section.fields.map((field) => ({
            fieldName: field.fieldName,
            remarks: field.remarks,
          })),
        })),
      });
    });
  }

  findAll() {
    return `This action returns all assignment`;
  }

  findOne(id: number) {
    return `This action returns a #${id} assignment`;
  }

  update(id: number, updateAssignmentDto: UpdateAssignmentDto) {
    return `This action updates a #${id} assignment`;
  }

  remove(id: number) {
    return `This action removes a #${id} assignment`;
  }
}
