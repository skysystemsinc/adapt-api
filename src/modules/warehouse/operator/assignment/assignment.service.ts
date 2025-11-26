import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment, AssignmentLevel } from './entities/assignment.entity';
import { AssignmentSection } from './entities/assignment-section.entity';
import { AssignmentSectionField } from './entities/assignment-section-field.entity';
import { Permissions } from 'src/modules/rbac/constants/permissions.constants';
import { hasPermission } from 'src/common/utils/helper.utils';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) { }

  async assign(applicationId: string, createAssignmentDto: CreateAssignmentDto, assignedById: string) {
    // GET USER WHO IS ASSIGNING THE TASK
    const user = await this.userRepository.findOne({
      where: { id: assignedById },
      relations: [
        'userRoles',
        'userRoles.role',
        'userRoles.role.rolePermissions',
        'userRoles.role.rolePermissions.permission',
      ],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.isActive) {
      throw new ConflictException('User is not active. Please contact the administrator.');
    }

    const isOfficer = hasPermission(user, Permissions.MANAGE_WAREHOUSE_APPLICATION_ASSIGNMENT);
    const isHOD = hasPermission(user, Permissions.IS_HOD);

    // ONLY OFFICER AND HOD CAN ASSIGN TASKS
    if (!isOfficer && !isHOD) {
      throw new ForbiddenException('You are not authorized to perform this action.');
    }

    // GET USER WHO IS BEING ASSIGNED THE TASK
    const assignedTo = await this.userRepository.findOne({
      where: { id: createAssignmentDto.assignedTo },
      relations: [
        'userRoles',
        'userRoles.role',
        'userRoles.role.rolePermissions',
        'userRoles.role.rolePermissions.permission',
      ],
    });

    if (!assignedTo) {
      throw new NotFoundException('User not found');
    }
    if (!assignedTo.isActive) {
      throw new ConflictException('User is not active. Please contact the administrator.');
    }

    // ONLY OFFICER CAN ASSIGN TASKS TO HOD
    if (isOfficer && !hasPermission(assignedTo, Permissions.IS_HOD)) {
      throw new ForbiddenException('You are not authorized to perform this action.');
    }
    // ONLY HOD CAN ASSIGN TASKS TO EXPERT
    if (isHOD && !hasPermission(assignedTo, Permissions.IS_EXPERT)) {
      throw new ForbiddenException('You are not authorized to perform this action.');
    }

    // DETERMINE THE ASSIGNMENT LEVEL BASED ON THE USER'S ROLE
    // OFFICER CAN ASSIGN TASKS TO HOD
    // HOD CAN ASSIGN TASKS TO EXPERT
    const assignmentLevel = isOfficer ? AssignmentLevel.OFFICER_TO_HOD : AssignmentLevel.HOD_TO_EXPERT;

    try {
      // TRANSACTION START
      const assignment = await this.dataSource.transaction(async (transactionalEntityManager) => {
        // Create assignment entity
        const assignmentEntity = transactionalEntityManager.create(Assignment, {
          applicationId: applicationId,
          assignedBy: assignedById,
          assignedTo: createAssignmentDto.assignedTo,
          level: assignmentLevel,
        });

        // Save assignment first to get the ID
        const savedAssignment = await transactionalEntityManager.save(Assignment, assignmentEntity);

        // Create and save sections with their fields
        for (const sectionDto of createAssignmentDto.sections) {
          const sectionEntity = transactionalEntityManager.create(AssignmentSection, {
            assignmentId: savedAssignment.id,
            sectionType: sectionDto.sectionType,
          });

          const savedSection = await transactionalEntityManager.save(AssignmentSection, sectionEntity);

          // Create and save fields for this section
          for (const fieldDto of sectionDto.fields) {
            const fieldEntity = transactionalEntityManager.create(AssignmentSectionField, {
              assignmentSectionId: savedSection.id,
              fieldName: fieldDto.fieldName,
              remarks: fieldDto.remarks,
            });

            await transactionalEntityManager.save(AssignmentSectionField, fieldEntity);
          }
        }

        return savedAssignment;
      });

      return {
        message: 'Assignment created successfully',
        assignment: assignment.id,
      };
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw new ConflictException('Failed to create assignment', error);
    }
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
