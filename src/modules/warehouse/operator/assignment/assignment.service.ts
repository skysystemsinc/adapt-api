import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment, AssignmentLevel, AssignmentStatus } from './entities/assignment.entity';
import { AssignmentSection } from './entities/assignment-section.entity';
import { AssignmentSectionField } from './entities/assignment-section-field.entity';
import { Permissions } from 'src/modules/rbac/constants/permissions.constants';
import { hasPermission } from 'src/common/utils/helper.utils';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { WarehouseOperatorApplicationRequest, WarehouseOperatorApplicationStatus } from '../../entities/warehouse-operator-application-request.entity';
import { ApplicationRejectionEntity } from '../../entities/application-rejection.entity';

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
            resourceId: sectionDto.resourceId,
            resourceType: sectionDto.resourceType,
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


  async rejectApplication(applicationId: string, rejectApplicationDto: RejectApplicationDto, assignedById: string) {
    // GET USER WHO IS REJECTING THE APPLICATION
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
    const isHOD = hasPermission(user, Permissions.IS_HOD);

    // ONLY HOD CAN REJECT THE APPLICATION
    if (!isHOD) {
      throw new ForbiddenException('You are not authorized to perform this action.');
    }

    const application = await this.dataSource.getRepository(WarehouseOperatorApplicationRequest).findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // GET USER WHO IS THE APPLICANT
    const assignedTo = await this.userRepository.findOne({
      where: { id: application.userId },
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

    try {
      // TRANSACTION START
      const assignment = await this.dataSource.transaction(async (transactionalEntityManager) => {
        // Create assignment entity
        const assignmentEntity = transactionalEntityManager.create(Assignment, {
          applicationId: applicationId,
          assignedBy: assignedById,
          assignedTo: application.userId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        });

        // Save assignment first to get the ID
        const savedAssignment = await transactionalEntityManager.save(Assignment, assignmentEntity);


        // Create and save sections with their fields
        for (const section of rejectApplicationDto.sections) {
          const sectionEntity = transactionalEntityManager.create(AssignmentSection, {
            assignmentId: savedAssignment.id,
            sectionType: section.sectionType,
            resourceId: section.resourceId,
            resourceType: section.resourceType,
          });

          const savedSection = await transactionalEntityManager.save(AssignmentSection, sectionEntity);

          // Create and save fields for this section
          for (const field of section.fields) {
            const fieldEntity = transactionalEntityManager.create(AssignmentSectionField, {
              assignmentSectionId: savedSection.id,
              fieldName: field.fieldName,
              remarks: field.remarks,
            });

            await transactionalEntityManager.save(AssignmentSectionField, fieldEntity);
          }
        }

        // Create application rejection entity
        const applicationRejectionEntity = transactionalEntityManager.create(ApplicationRejectionEntity, {
          applicationId: applicationId,
          rejectionBy: assignedById,
          rejectionReason: rejectApplicationDto.remarks,
          unlockedSections: rejectApplicationDto.sections.map(section => section.sectionType),
        });

        // Save application rejection entity
        await transactionalEntityManager.save(ApplicationRejectionEntity, applicationRejectionEntity);

        const assignmentHodToExpertCount = await transactionalEntityManager.getRepository(Assignment).count({
          where: {
            applicationId: applicationId,
            level: AssignmentLevel.HOD_TO_EXPERT,
          },
        });

        const assignmentHodToApplicantCount = await transactionalEntityManager.getRepository(Assignment).count({
          where: {
            applicationId: applicationId,
            level: AssignmentLevel.HOD_TO_APPLICANT,
          },
        });

        let totalAssignmentCount = assignmentHodToExpertCount + assignmentHodToApplicantCount;

        if (totalAssignmentCount >= 6 && assignmentHodToApplicantCount > 0) {
          const updateResult = await transactionalEntityManager.getRepository(WarehouseOperatorApplicationRequest).update(applicationId, {
            status: WarehouseOperatorApplicationStatus.REJECTED,
          });

          if (updateResult.affected === 0) {
            throw new ConflictException('Failed to update application status');
          }
        }

        return savedAssignment;

      });

      return {
        message: 'Application rejected successfully',
        assignment: assignment.id,
      };
    } catch (error) {
      console.error('Error rejecting application:', error);
      throw new ConflictException('Failed to reject application', error);
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

  async getData(applicationId: string) {
    const assignment = await this.dataSource.getRepository(Assignment).findOne({
      where: { applicationId: applicationId },
      relations: [
        'application',
        'application.authorizedSignatories',
        'assignedByUser',
        'assignedToUser',
        'sections',
        'sections.fields',
        'parentAssignment',
        'childAssignments',
      ],
    });
    return assignment;
  }

  async getMyAssignments(userId: string) {
    const assignments = await this.dataSource.getRepository(Assignment).find({
      where: { assignedTo: userId },
      relations: [
        'application',
        'application.user',
        'sections',
        'sections.fields',
        'assignedByUser',
      ],
      order: { createdAt: 'DESC' },
    });
    return assignments;
  }

  async getAssignmentByApplicationId(applicationId: string, userId: string) {
    const assignment = await this.dataSource.getRepository(Assignment).findOne({
      where: {
        applicationId: applicationId,
        assignedTo: userId
      },
      relations: [
        'sections',
        'sections.fields',
      ],
    });
    return assignment;
  }

  /**
   * Assign tasks to a warehouse location application
   */
  async assignToLocation(applicationLocationId: string, createAssignmentDto: CreateAssignmentDto, assignedById: string) {
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
    const assignmentLevel = isOfficer ? AssignmentLevel.OFFICER_TO_HOD : AssignmentLevel.HOD_TO_EXPERT;

    try {
      // TRANSACTION START
      const assignment = await this.dataSource.transaction(async (transactionalEntityManager) => {
        // Create assignment entity with applicationLocationId instead of applicationId
        const assignmentEntity = transactionalEntityManager.create(Assignment, {
          applicationLocationId: applicationLocationId,
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
            resourceId: sectionDto.resourceId,
            resourceType: sectionDto.resourceType || 'warehouse_location_application_section',
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
        message: 'Location assignment created successfully',
        assignment: assignment.id,
      };
    } catch (error) {
      console.error('Error creating location assignment:', error);
      throw new ConflictException('Failed to create location assignment', error);
    }
  }

  async getAssignmentByLocationId(applicationLocationId: string, userId: string) {
    const assignment = await this.dataSource.getRepository(Assignment).findOne({
      where: {
        applicationLocationId: applicationLocationId,
        assignedTo: userId
      },
      relations: [
        'sections',
        'sections.fields',
      ],
    });
    return assignment;
  }

  /**
   * Get all assignments for a specific application
   * Returns list of assignments with assignedTo user IDs
   */
  async getAssignmentsByApplicationId(applicationId: string) {
    const assignments = await this.dataSource.getRepository(Assignment).find({
      where: { applicationId: applicationId },
      select: ['id', 'assignedTo', 'assignedBy', 'level', 'status', 'createdAt'],
      relations: ['assignedToUser'],
    });
    return assignments;
  }

  /**
   * Get all assignments for a specific location application
   * Returns list of assignments with assignedTo user IDs
   */
  async getAssignmentsByLocationId(applicationLocationId: string) {
    const assignments = await this.dataSource.getRepository(Assignment).find({
      where: { applicationLocationId: applicationLocationId },
      select: ['id', 'assignedTo', 'assignedBy', 'level', 'status', 'createdAt'],
      relations: ['assignedToUser'],
    });
    return assignments;
  }
}
