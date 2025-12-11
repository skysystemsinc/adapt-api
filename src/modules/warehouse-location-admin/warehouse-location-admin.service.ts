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
  // Reusable select structures
  private readonly documentSelect = {
    id: true,
    originalFileName: true,
    filePath: true,
    mimeType: true,
  };

  private readonly userSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
  };

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

    // Subquery to get the latest assignment ID for each location
    // Using raw SQL for correlated subquery
    const latestAssignmentSubquery = `(
      SELECT a.id 
      FROM assignment a 
      WHERE a."applicationLocationId" = location.id 
      ORDER BY a."createdAt" DESC 
      LIMIT 1
    )`;

    const queryBuilder = this.warehouseLocationRepository
      .createQueryBuilder('location')
      .leftJoin('location.user', 'user')
      .leftJoin(
        'assignment',
        'assignment',
        `assignment."applicationLocationId" = location.id AND assignment.id = ${latestAssignmentSubquery}`
      )
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
      ])
      .addSelect('assignment.level', 'assignmentLevel')
      .addSelect('assignment.assessmentId', 'assignmentAssessmentId')
      .addSelect('assignment.status', 'assignmentStatus');

    // Exclude DRAFT status applications
    queryBuilder.andWhere('location.status != :draftStatus', { draftStatus: WarehouseLocationStatus.DRAFT });

    // If user is HOD or Expert, filter by assignment
    if (user && (hasPermission(user, Permissions.IS_HOD) || hasPermission(user, Permissions.IS_EXPERT))) {
      queryBuilder
        .andWhere('assignment."assignedTo" = :assignedToUserId', { assignedToUserId: userId });
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

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Use getRawAndEntities to get both entities and raw data (for aliased fields)
    const { entities, raw } = await queryBuilder.getRawAndEntities();

    // Map assignmentLevel from raw data to entities
    const data = entities.map((entity, index) => {
      const rawData = raw[index];
      return {
        ...entity,
        assignmentLevel: rawData?.assignmentLevel || null,
        assignmentStatus: rawData?.assignmentStatus || null,
        assignmentAssessmentId: rawData?.assignmentAssessmentId || null,
      };
    });

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
        user: this.userSelect,
        facility: {
          id: true,
          facilityName: true,
          storageFacilityType: true,
          address: true,
          numberOfStorageUnits: true,
          individualCapacityPerUnit: true,
          totalCapacity: true,
          storageFacilitiesAppliedFor: true,
          produceForAccreditation: true,
          totalCapacityAppliedFor: true,
          plinthHeight: true,
          length: true,
          width: true,
          height: true,
          ownership: true,
          leaseDuration: true,
          borrowerCodeOfPropertyOwner: true,
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
          weighbridgeCalibrationCertificate: this.documentSelect,
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
          photograph: this.documentSelect,
          academicQualifications: {
            id: true,
            degree: true,
            major: true,
            institute: true,
            country: true,
            yearOfPassing: true,
            grade: true,
            academicCertificate: this.documentSelect,
          },
          professionalQualifications: {
            id: true,
            certificationTitle: true,
            issuingBody: true,
            country: true,
            dateOfAward: true,
            membershipNumber: true,
            hasExpiryDate: true,
            professionalCertificate: this.documentSelect,
          },
          trainings: {
            id: true,
            trainingTitle: true,
            conductedBy: true,
            trainingType: true,
            duration: true,
            dateOfCompletion: true,
            trainingCertificate: this.documentSelect,
          },
          professionalExperiences: {
            id: true,
            positionHeld: true,
            organizationName: true,
            organizationAddress: true,
            natureOfOrganization: true,
            dateOfAppointment: true,
            dateOfLeaving: true,
            duration: true,
            responsibilities: true,
            experienceLetter: this.documentSelect,
          },
          declaration: {
            id: true,
            writeOffAvailed: true,
            defaultOfFinance: true,
            placementOnECL: true,
            convictionOrPleaBargain: true,
          },
        },
        warehouseLocationChecklist: {
          id: true,
          ownershipLegalDocuments: {
            id: true,
            ownershipDeed: true,
            mutationDeed: true,
            nocNec: true,
            factoryLayout: true,
            leaseAgreement: true,
            propertyWarranty: true,
            agreementUndertaking: true,
            ownershipDeedDocument: this.documentSelect,
            mutationDeedDocument: this.documentSelect,
            nocNecDocument: this.documentSelect,
            factoryLayoutDocument: this.documentSelect,
            leaseAgreementDocument: this.documentSelect,
            propertyWarrantyDocument: this.documentSelect,
            agreementUndertakingDocument: this.documentSelect,
          },
          humanResourcesKey: {
            id: true,
            qcPersonnel: true,
            warehouseSupervisor: true,
            dataEntryOperator: true,
            qcPersonnelDocument: this.documentSelect,
            warehouseSupervisorDocument: this.documentSelect,
            dataEntryOperatorDocument: this.documentSelect,
          },
          locationRisk: {
            id: true,
            warehouseOutsideFloodingArea: true,
            warehouseOutsideFloodingAreaDocument: this.documentSelect,
          },
          securityPerimeter: {
            id: true,
            securedBoundaryWall: true,
            reinforcedBarbedWire: true,
            fullyGated: true,
            securityGuards24x7: true,
            cctvCameras: true,
            securedBoundaryWallDocument: this.documentSelect,
            reinforcedBarbedWireDocument: this.documentSelect,
            fullyGatedDocument: this.documentSelect,
            securityGuards24x7Document: this.documentSelect,
            cctvCamerasDocument: this.documentSelect,
          },
          infrastructureUtilities: {
            id: true,
            functionalWeighbridge: true,
            samplingTestingArea: true,
            calibratedInstruments: true,
            functionalOffice: true,
            operationalToilets: true,
            electricityGasUtilities: true,
            backupGenerator: true,
            adequateResidentialArrangements: true,
            axialAerationFans: true,
            ventsExhaustFans: true,
            technicalDrawing: true,
            dryingFacility: true,
            temperatureSensorCables: true,
            functionalWeighbridgeDocument: this.documentSelect,
            samplingTestingAreaDocument: this.documentSelect,
            calibratedInstrumentsDocument: this.documentSelect,
            functionalOfficeDocument: this.documentSelect,
            operationalToiletsDocument: this.documentSelect,
            electricityGasUtilitiesDocument: this.documentSelect,
            backupGeneratorDocument: this.documentSelect,
            adequateResidentialArrangementsDocument: this.documentSelect,
            axialAerationFansDocument: this.documentSelect,
            ventsExhaustFansDocument: this.documentSelect,
            technicalDrawingDocument: this.documentSelect,
            dryingFacilityDocument: this.documentSelect,
            temperatureSensorCablesDocument: this.documentSelect,
          },
          storageFacilities: {
            id: true,
            securedDoors: true,
            plasteredFlooring: true,
            plasteredWalls: true,
            intactCeiling: true,
            functionalWindows: true,
            protectiveNetting: true,
            functionalExhaustFans: true,
            freeFromPests: true,
            fireSafetyMeasures: true,
            securedDoorsDocument: this.documentSelect,
            plasteredFlooringDocument: this.documentSelect,
            plasteredWallsDocument: this.documentSelect,
            intactCeilingDocument: this.documentSelect,
            functionalWindowsDocument: this.documentSelect,
            protectiveNettingDocument: this.documentSelect,
            functionalExhaustFansDocument: this.documentSelect,
            freeFromPestsDocument: this.documentSelect,
            fireSafetyMeasuresDocument: this.documentSelect,
          },
          registrationFee: {
            id: true,
            bankPaymentSlipDocument: this.documentSelect,
          },
          declaration: {
            id: true,
            informationTrueComplete: true,
            authorizeVerification: true,
          },
        },
      },
      relations: {
        user: true,
        facility: true,
        contact: true,
        jurisdiction: true,
        security: true,
        fireSafety: true,
        weighing: {
          weighbridgeCalibrationCertificate: true,
        },
        technicalQualitative: true,
        humanResources: {
          photograph: true,
          academicQualifications: {
            academicCertificate: true,
          },
          professionalQualifications: {
            professionalCertificate: true,
          },
          trainings: {
            trainingCertificate: true,
          },
          professionalExperiences: {
            experienceLetter: true,
          },
          declaration: true,
        },
        warehouseLocationChecklist: {
          ownershipLegalDocuments: {
            ownershipDeedDocument: true,
            mutationDeedDocument: true,
            nocNecDocument: true,
            factoryLayoutDocument: true,
            leaseAgreementDocument: true,
            propertyWarrantyDocument: true,
            agreementUndertakingDocument: true,
          },
          humanResourcesKey: {
            qcPersonnelDocument: true,
            warehouseSupervisorDocument: true,
            dataEntryOperatorDocument: true,
          },
          locationRisk: {
            warehouseOutsideFloodingAreaDocument: true,
          },
          securityPerimeter: {
            securedBoundaryWallDocument: true,
            reinforcedBarbedWireDocument: true,
            fullyGatedDocument: true,
            securityGuards24x7Document: true,
            cctvCamerasDocument: true,
          },
          infrastructureUtilities: {
            functionalWeighbridgeDocument: true,
            samplingTestingAreaDocument: true,
            calibratedInstrumentsDocument: true,
            functionalOfficeDocument: true,
            operationalToiletsDocument: true,
            electricityGasUtilitiesDocument: true,
            backupGeneratorDocument: true,
            adequateResidentialArrangementsDocument: true,
            axialAerationFansDocument: true,
            ventsExhaustFansDocument: true,
            technicalDrawingDocument: true,
            dryingFacilityDocument: true,
            temperatureSensorCablesDocument: true,
          },
          storageFacilities: {
            securedDoorsDocument: true,
            plasteredFlooringDocument: true,
            plasteredWallsDocument: true,
            intactCeilingDocument: true,
            functionalWindowsDocument: true,
            protectiveNettingDocument: true,
            functionalExhaustFansDocument: true,
            freeFromPestsDocument: true,
            fireSafetyMeasuresDocument: true,
          },
          registrationFee: {
            bankPaymentSlipDocument: true,
          },
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
          applicationLocationId: id,  // Use applicationLocationId for location applications
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
          warehouseLocationChecklist: null,
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

    // Filter security and fire safety (section 4 - filter individually)
    if (assignedSections.has('security_fire_safety')) {
      const assignedResourceIds = assignedSections.get('security_fire_safety')!;
      // Filter security individually
      if (application.security && !assignedResourceIds.has(application.security.id)) {
        application.security = null as any;
      }
      // Filter fire safety individually
      if (application.fireSafety && !assignedResourceIds.has(application.fireSafety.id)) {
        application.fireSafety = null as any;
      }
    } else {
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
    // Note: HR assignments use sub-item IDs (personalDetails.id, academicQualifications[].id, etc.) as resourceId,
    // not the HR entity ID. So we need to check if any of the HR's sub-items are assigned.
    if (assignedSections.has('human_resources')) {
      const assignedResourceIds = assignedSections.get('human_resources')!;
      application.humanResources = application.humanResources?.filter((hr) => {
        // Check if HR entity ID is assigned (used for personalDetails sub-item)
        if (assignedResourceIds.has(hr.id)) {
          return true;
        }

        // Check if any sub-item is assigned
        // Academic Qualifications
        if (hr.academicQualifications?.some(aq => assignedResourceIds.has(aq.id))) {
          return true;
        }

        // Professional Qualifications
        if (hr.professionalQualifications?.some(pq => assignedResourceIds.has(pq.id))) {
          return true;
        }

        // Trainings
        if (hr.trainings?.some(training => assignedResourceIds.has(training.id))) {
          return true;
        }

        // Professional Experiences
        if (hr.professionalExperiences?.some(exp => assignedResourceIds.has(exp.id))) {
          return true;
        }

        // Declaration
        if (hr.declaration?.id && assignedResourceIds.has(hr.declaration.id)) {
          return true;
        }

        return false;
      }) || [];
    } else {
      application.humanResources = [];
    }

    // Filter checklist (section 8)
    if (assignedSections.has('checklist')) {
      const assignedResourceIds = assignedSections.get('checklist')!;
      if (application.warehouseLocationChecklist) {
        // Filter each checklist subsection individually
        if (application.warehouseLocationChecklist.ownershipLegalDocuments && !assignedResourceIds.has(application.warehouseLocationChecklist.ownershipLegalDocuments.id)) {
          application.warehouseLocationChecklist.ownershipLegalDocuments = null as any;
        }
        if (application.warehouseLocationChecklist.humanResourcesKey && !assignedResourceIds.has(application.warehouseLocationChecklist.humanResourcesKey.id)) {
          application.warehouseLocationChecklist.humanResourcesKey = null as any;
        }
        if (application.warehouseLocationChecklist.locationRisk && !assignedResourceIds.has(application.warehouseLocationChecklist.locationRisk.id)) {
          application.warehouseLocationChecklist.locationRisk = null as any;
        }
        if (application.warehouseLocationChecklist.securityPerimeter && !assignedResourceIds.has(application.warehouseLocationChecklist.securityPerimeter.id)) {
          application.warehouseLocationChecklist.securityPerimeter = null as any;
        }
        if (application.warehouseLocationChecklist.infrastructureUtilities && !assignedResourceIds.has(application.warehouseLocationChecklist.infrastructureUtilities.id)) {
          application.warehouseLocationChecklist.infrastructureUtilities = null as any;
        }
        if (application.warehouseLocationChecklist.storageFacilities && !assignedResourceIds.has(application.warehouseLocationChecklist.storageFacilities.id)) {
          application.warehouseLocationChecklist.storageFacilities = null as any;
        }
        if (application.warehouseLocationChecklist.registrationFee && !assignedResourceIds.has(application.warehouseLocationChecklist.registrationFee.id)) {
          application.warehouseLocationChecklist.registrationFee = null as any;
        }
        if (application.warehouseLocationChecklist.declaration && !assignedResourceIds.has(application.warehouseLocationChecklist.declaration.id)) {
          application.warehouseLocationChecklist.declaration = null as any;
        }
      }
    } else {
      application.warehouseLocationChecklist = null as any;
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
   * @param userId - The ID of the user making the request
   * @param applicationId - Optional application ID to filter out already-assigned users
   */
  async findAllWarehouseLocationRoles(userId: string, applicationId?: string) {
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

    // If applicationId is provided, exclude users already assigned to this application
    if (applicationId) {
      usersQuery.andWhere(
        `user.id NOT IN (
          SELECT DISTINCT a."assignedTo" 
          FROM assignment a 
          WHERE a."applicationLocationId" = :applicationId
        )`,
        { applicationId }
      );
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
