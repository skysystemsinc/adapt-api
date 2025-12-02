import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { QueryLocationApplicationDto } from './dto/query-location-application.dto';
import { WarehouseLocation, WarehouseLocationStatus } from '../warehouse-location/entities/warehouse-location.entity';
import { User } from '../users/entities/user.entity';
import { Permissions } from '../rbac/constants/permissions.constants';
import { hasPermission } from 'src/common/utils/helper.utils';
import { Assignment } from '../warehouse/operator/assignment/entities/assignment.entity';

@Injectable()
export class WarehouseLocationAdminService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private warehouseLocationRepository: Repository<WarehouseLocation>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async findAllWarehouseLocationsPaginated(query: QueryLocationApplicationDto, userId: string) {
    const { page = 1, status, search, limit = 10, sortBy = 'createdAt', sortOrder = 'ASC' } = query;

    let user: User | null = null;
    if (userId) {
      user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['userRoles', 'userRoles.role', 'userRoles.role.rolePermissions', 'userRoles.role.rolePermissions.permission'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user has required permissions
      const hasViewPermission = hasPermission(user, Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT);
      const hasManagePermission = hasPermission(user, Permissions.MANAGE_WAREHOUSE_APPLICATION_ASSIGNMENT);
      const is_hod = hasPermission(user, Permissions.IS_HOD);
      const is_expert = hasPermission(user, Permissions.IS_EXPERT);

      if (!hasViewPermission && !hasManagePermission && !is_hod && !is_expert) {
        throw new ForbiddenException('You do not have permission to view warehouse location applications');
      }
    }

    const queryBuilder = this.warehouseLocationRepository
      .createQueryBuilder('location')
      .leftJoin('location.user', 'user')
      .leftJoin('location.facility', 'facility')
      .select([
        'location.id',
        'location.applicationId',
        'location.status',
        'location.createdAt',
        'location.updatedAt',
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'facility.id',
        'facility.facilityName',
      ]);

    // Exclude DRAFT status applications
    queryBuilder.andWhere('location.status != :draftStatus', { draftStatus: WarehouseLocationStatus.DRAFT });

    // If user is HOD or Expert, filter by assignment
    if (user && (hasPermission(user, Permissions.IS_HOD) || hasPermission(user, Permissions.IS_EXPERT))) {
      queryBuilder
        .innerJoin('assignment', 'assignment', 'assignment.applicationId = location.id')
        .andWhere('assignment.assignedTo = :assignedToUserId', { assignedToUserId: userId });
    }

    if (status) {
      queryBuilder.andWhere('location.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR facility.facilityName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    queryBuilder.orderBy(`location.${sortBy}`, sortOrder);
    queryBuilder.addOrderBy('location.createdAt', 'ASC');

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    let user: User | null = null;

    if (userId) {
      user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['userRoles', 'userRoles.role', 'userRoles.role.rolePermissions', 'userRoles.role.rolePermissions.permission'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id },
      select: {
        id: true,
        applicationId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        facility: {
          id: true,
          facilityName: true,
          storageFacilityType: true,
          address: true,
          numberOfStorageUnits: true,
          individualCapacityPerUnit: true,
          totalCapacity: true,
          storageFacilitiesAppliedFor: true,
          totalCapacityAppliedFor: true,
          plinthHeight: true,
          length: true,
          width: true,
          height: true,
          ownership: true,
          leaseDuration: true,
        },
        contact: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          mobileNumber: true,
        },
        jurisdiction: {
          id: true,
          jurisdictionalPoliceStationName: true,
          policeStationDistance: true,
          nearestFireStationName: true,
          fireStationDistance: true,
          numberOfEntryAndExit: true,
          compoundWallFencing: true,
          heightOfCompoundWall: true,
          compoundWallBarbedFencing: true,
          damageOnCompoundWall: true,
        },
        security: {
          id: true,
          guardsDeployed: true,
          NumberOfCameras: true,
          otherSecurityMeasures: true,
        },
        fireSafety: {
          id: true,
          fireExtinguishers: true,
          fireBuckets: true,
          waterArrangements: true,
          fireSafetyAlarms: true,
          otherFireSafetyMeasures: true,
        },
        weighing: {
          id: true,
          weighbridgeAvailable: true,
          weighbridgeLocation: true,
          weighbridgeCapacity: true,
          weighbridgeMakeModel: true,
          weighbridgeInstallationDate: true,
          weighbridgeCalibrationStatus: true,
          weighbridgeNextCalibrationDueDate: true,
          weighbridgeOwnerOperatorName: true,
          weighbridgeAddressLocation: true,
          weighbridgeDistanceFromFacility: true,
        },
        technicalQualitative: {
          id: true,
          laboratoryFacility: true,
          minimumLabEquipmentExist: true,
          equipmentCalibrated: true,
          washroomsExist: true,
          waterAvailability: true,
          officeInternetFacility: true,
          electricityAvailable: true,
          gasAvailable: true,
          generatorAvailable: true,
          otherUtilitiesFacilities: true,
        },
        humanResources: {
          id: true,
          fullName: true,
          fathersHusbandsName: true,
          cnicPassport: true,
          nationality: true,
          dateOfBirth: true,
          residentialAddress: true,
          businessAddress: true,
          telephoneNumber: true,
          mobileNumber: true,
          email: true,
          hrNationalTaxNumber: true,
        },
      },
      relations: {
        user: true,
        facility: true,
        contact: true,
        jurisdiction: true,
        security: true,
        fireSafety: true,
        weighing: true,
        technicalQualitative: true,
        humanResources: {
          academicQualifications: true,
          professionalQualifications: true,
          trainings: true,
          professionalExperiences: true,
          declaration: true,
        },
      },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    // If user is HOD or Expert, filter by assignment
    if (user && (hasPermission(user, Permissions.IS_HOD) || hasPermission(user, Permissions.IS_EXPERT))) {
      const assignment = await this.dataSource.getRepository(Assignment).findOne({
        where: {
          applicationId: id,
          assignedTo: userId,
        },
        relations: ['sections', 'sections.fields'],
      });

      if (assignment && assignment.sections) {
        this.filterApplicationByAssignment(warehouseLocation, assignment);
      } else {
        // If no assignment found, return empty data for HOD/Expert
        return {
          ...warehouseLocation,
          facility: null,
          contact: null,
          jurisdiction: null,
          security: null,
          fireSafety: null,
          weighing: null,
          technicalQualitative: null,
          humanResources: [],
          totalCount: 0,
        };
      }
    }

    // Calculate total count of related entities
    const totalCount =
      (warehouseLocation.facility ? 1 : 0) +
      (warehouseLocation.contact ? 1 : 0) +
      (warehouseLocation.jurisdiction ? 1 : 0) +
      (warehouseLocation.security ? 1 : 0) +
      (warehouseLocation.fireSafety ? 1 : 0) +
      (warehouseLocation.weighing ? 1 : 0) +
      (warehouseLocation.technicalQualitative ? 1 : 0) +
      (warehouseLocation.humanResources?.length || 0);

    return {
      ...warehouseLocation,
      totalCount,
    };
  }

  private filterApplicationByAssignment(
    application: WarehouseLocation,
    assignment: Assignment
  ) {
    // Helper function to map sectionType to entity name
    const getEntityNameFromSectionType = (sectionType: string): string | null => {
      const match = sectionType.match(/^(\d+)-/);
      if (!match) return null;

      const sectionNumber = match[1];

      // Map section numbers to entity names for warehouse location
      const sectionNumberToEntity: Record<string, string> = {
        '1': 'facility',
        '2': 'contact',
        '3': 'jurisdiction',
        '4': 'security_fire_safety',
        '5': 'weighing',
        '6': 'technical_qualitative',
        '7': 'human_resources',
        '8': 'checklist',
      };

      return sectionNumberToEntity[sectionNumber] || null;
    };

    // Create a map of assigned sections by entity name and resourceId
    const assignedSections = new Map<string, Set<string>>();

    assignment.sections.forEach((section) => {
      const entityName = getEntityNameFromSectionType(section.sectionType);
      if (!entityName) {
        console.warn(`Unknown sectionType: ${section.sectionType}`);
        return;
      }

      if (!assignedSections.has(entityName)) {
        assignedSections.set(entityName, new Set());
      }
      assignedSections.get(entityName)!.add(section.resourceId || 'default');
    });

    // Filter facility
    if (!assignedSections.has('facility')) {
      application.facility = null as any;
    }

    // Filter contact
    if (!assignedSections.has('contact')) {
      application.contact = null as any;
    }

    // Filter jurisdiction
    if (!assignedSections.has('jurisdiction')) {
      application.jurisdiction = null as any;
    }

    // Filter security and fire safety (combined in section 4)
    if (!assignedSections.has('security_fire_safety')) {
      application.security = null as any;
      application.fireSafety = null as any;
    }

    // Filter weighing
    if (!assignedSections.has('weighing')) {
      application.weighing = null as any;
    }

    // Filter technical qualitative
    if (!assignedSections.has('technical_qualitative')) {
      application.technicalQualitative = null as any;
    }

    // Filter human resources
    if (assignedSections.has('human_resources')) {
      const assignedResourceIds = assignedSections.get('human_resources')!;
      application.humanResources = application.humanResources?.filter(
        (hr) => assignedResourceIds.has(hr.id)
      ) || [];
    } else {
      application.humanResources = [];
    }
  }

  private async getFirstPendingApplicationId(): Promise<string | null> {
    const firstPending = await this.warehouseLocationRepository.findOne({
      where: { status: WarehouseLocationStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
    return firstPending?.id || null;
  }

  /**
   * Get all users grouped by role for assignment
   */
  async findAllWarehouseLocationRoles(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: {
        userRoles: {
          role: {
            rolePermissions: {
              permission: true,
            },
          },
        },
        organization: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const usersQuery = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .innerJoin('user.userRoles', 'ur')
      .innerJoin('ur.role', 'role')
      .innerJoin('role.rolePermissions', 'rolePermissions')
      .innerJoin('rolePermissions.permission', 'permission')
      .select(`
        role.name AS role,
        json_agg(
          json_build_object(
            'id', "user"."id",
            'firstName', "user"."firstName",
            'lastName', "user"."lastName",
            'email', "user"."email"
          )
        ) AS users
      `);

    if (hasPermission(user, Permissions.IS_HOD)) {
      if (user.organization) {
        usersQuery.where(`permission.name = :name AND user.organizationId = :organizationId`, {
          name: Permissions.IS_EXPERT,
          organizationId: user.organization.id
        });
      } else {
        throw new ForbiddenException('User does not have an organization');
      }
    } else if (hasPermission(user, Permissions.MANAGE_WAREHOUSE_APPLICATION_ASSIGNMENT)) {
      usersQuery.where(`permission.name = :name`, { name: Permissions.IS_HOD });
    }

    usersQuery.groupBy('role.id');
    const users = await usersQuery.getRawMany();

    // Convert to object keyed by role
    const grouped: Record<string, any[]> = {};
    for (const row of users) {
      grouped[row.role] = row.users;
    }

    return grouped;
  }
}
