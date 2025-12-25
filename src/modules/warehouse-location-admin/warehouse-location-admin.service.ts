import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { QueryLocationApplicationDto } from './dto/query-location-application.dto';
import { WarehouseLocation, WarehouseLocationStatus } from '../warehouse-location/entities/warehouse-location.entity';
import { User } from '../users/entities/user.entity';
import { Permissions } from '../rbac/constants/permissions.constants';
import { hasPermission } from 'src/common/utils/helper.utils';
import { Assignment } from '../warehouse/operator/assignment/entities/assignment.entity';
import { RegistrationApplication } from '../registration-application/entities/registration-application.entity';

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

    @InjectRepository(RegistrationApplication)
    private registrationApplicationRequestRepository: Repository<RegistrationApplication>,
  ) { }

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
        'location.metadata',
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

    // For HOD/Expert users: filter to only locations where they have ANY assignment
    // (not just where the latest assignment is to them)
    if (user && (hasPermission(user, Permissions.IS_HOD) || hasPermission(user, Permissions.IS_EXPERT))) {
      queryBuilder.andWhere(
        `location.id IN (
          SELECT DISTINCT a."applicationLocationId" 
          FROM assignment a 
          WHERE a."assignedTo" = :assignedToUserId
        )`,
        { assignedToUserId: userId }
      );
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
        isResubmitted: entity.metadata?.isResubmitted || false,
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
    if (user &&
      (!hasPermission(user, Permissions.IS_OFFICER) &&
      !hasPermission(user, Permissions.REVIEW_FINAL_APPLICATION) &&
        !hasPermission(user, Permissions.REVIEW_ASSESSMENT))) {
      const assignment = await this.dataSource.getRepository(Assignment).findOne({
        where: {
          applicationLocationId: id,  // Use applicationLocationId for location applications
          assignedTo: userId,
        },
        relations: ['sections', 'sections.fields'],
      });

      if (assignment && assignment.sections
        && !hasPermission(user, Permissions.REVIEW_FINAL_APPLICATION)
        && !hasPermission(user, Permissions.REVIEW_ASSESSMENT)) {
        this.filterApplicationByAssignment(warehouseLocation, assignment);
      } else {
        // If no assignment found, return empty data for HOD/Expert
        // Note: WarehouseLocation doesn't have metadata field like WarehouseOperatorApplicationRequest
        const resubmittedSections: string[] = [];
        const resubmittedResourcesBySection: Record<string, any> = {};

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
          resubmittedSections,
          resubmittedResourcesBySection,
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
    // Create a map of assigned fields by section and resourceId
    const assignedFields = new Map<string, Set<string>>();

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

      // Store assigned fields for this section
      if (section.fields && section.fields.length > 0) {
        const fieldKey = `${entityName}-${section.resourceId || 'default'}`;
        if (!assignedFields.has(fieldKey)) {
          assignedFields.set(fieldKey, new Set());
        }
        section.fields.forEach((field) => {
          assignedFields.get(fieldKey)!.add(field.fieldName);
        });
      }
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
    if (assignedSections.has('weighing')) {
      const assignedResourceIds = assignedSections.get('weighing')!;
      if (application.weighing && !assignedResourceIds.has(application.weighing.id)) {
        application.weighing = null as any;
      } else if (application.weighing) {
        // Check if "Weighbridge Calibration Certificate" field is assigned
        const weighingKey = `weighing-${application.weighing.id}`;
        const weighingFields = assignedFields.get(weighingKey);
        if (weighingFields && weighingFields.size > 0) {
          const normalizeFieldName = (str: string): string => {
            return str
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-+|-+$/g, '');
          };
          const normalizedWeighbridgeCert = 'weighbridge-calibration-certificate';
          const isWeighbridgeCertAssigned = Array.from(weighingFields).some(field =>
            normalizeFieldName(field).includes(normalizedWeighbridgeCert) ||
            normalizedWeighbridgeCert.includes(normalizeFieldName(field))
          );
          if (!isWeighbridgeCertAssigned) {
            application.weighing.weighbridgeCalibrationCertificate = null as any;
          }
        }
      }
    } else {
      application.weighing = null as any;
    }

    // Filter technical qualitative
    if (!assignedSections.has('technical_qualitative')) {
      application.technicalQualitative = null as any;
    }

    // Filter human resources
    // Keep HR if the HR entity itself (hr.id) is assigned OR any sub-item is assigned.
    // Then filter sub-item arrays to only include assigned items.
    // If hr.id is not assigned, clear personalDetails fields (Basic Facility Information).
    if (assignedSections.has('human_resources')) {
      const assignedResourceIds = assignedSections.get('human_resources')!;
      application.humanResources = application.humanResources
        ?.filter((hr) => {
          const hasPersonalDetails = assignedResourceIds.has(hr.id); // personalDetails uses hr.id
          const hasAcademicQualification = hr.academicQualifications?.some((aq) => assignedResourceIds.has(aq.id));
          const hasProfessionalQualification = hr.professionalQualifications?.some((pq) => assignedResourceIds.has(pq.id));
          const hasTraining = hr.trainings?.some((training) => assignedResourceIds.has(training.id));
          const hasExperience = hr.professionalExperiences?.some((exp) => assignedResourceIds.has(exp.id));
          const hasDeclaration = hr.declaration?.id && assignedResourceIds.has(hr.declaration.id);

          // Keep HR if any of its items (including itself) are assigned
          return (
            hasPersonalDetails ||
            hasAcademicQualification ||
            hasProfessionalQualification ||
            hasTraining ||
            hasExperience ||
            hasDeclaration
          );
        })
        ?.map((hr) => {
          const hasPersonalDetails = assignedResourceIds.has(hr.id);

          // If personalDetails (hr.id) is not assigned, clear personalDetails fields
          // This prevents "Basic Facility Information" from being shown
          // Keep fullName for HR card title display
          if (!hasPersonalDetails) {
            hr.fathersHusbandsName = null as any;
            hr.cnicPassport = null as any;
            hr.nationality = null as any;
            hr.dateOfBirth = null as any;
            hr.residentialAddress = null as any;
            hr.businessAddress = null as any;
            hr.telephoneNumber = null as any;
            hr.mobileNumber = null as any;
            hr.email = null as any;
            hr.hrNationalTaxNumber = null as any;
            hr.photograph = null as any;
          } else {
            // Check if "Photograph" field is assigned
            const personalDetailsKey = `human_resources-${hr.id}`;
            const personalDetailsFields = assignedFields.get(personalDetailsKey);
            if (personalDetailsFields && personalDetailsFields.size > 0) {
              const normalizeFieldName = (str: string): string => {
                return str
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, '-')
                  .replace(/-+/g, '-')
                  .replace(/^-+|-+$/g, '');
              };
              const normalizedPhotograph = 'photograph';
              const isPhotographAssigned = Array.from(personalDetailsFields).some(field =>
                normalizeFieldName(field).includes(normalizedPhotograph) ||
                normalizedPhotograph.includes(normalizeFieldName(field))
              );
              if (!isPhotographAssigned) {
                hr.photograph = null as any;
              }
            }
          }

          // Filter sub-item arrays to only include assigned ones
          if (hr.academicQualifications) {
            hr.academicQualifications = hr.academicQualifications
              .filter((aq) => assignedResourceIds.has(aq.id))
              .map((aq) => {
                const aqKey = `human_resources-${aq.id}`;
                const aqFields = assignedFields.get(aqKey);
                if (aqFields && aqFields.size > 0) {
                  const normalizeFieldName = (str: string): string => {
                    return str
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '-')
                      .replace(/-+/g, '-')
                      .replace(/^-+|-+$/g, '');
                  };
                  const normalizedAcademicCert = 'academic-certificate';
                  const isAcademicCertAssigned = Array.from(aqFields).some(field =>
                    normalizeFieldName(field).includes(normalizedAcademicCert) ||
                    normalizedAcademicCert.includes(normalizeFieldName(field))
                  );
                  if (!isAcademicCertAssigned) {
                    aq.academicCertificate = null as any;
                  }
                }
                return aq;
              });
          }
          if (hr.professionalQualifications) {
            hr.professionalQualifications = hr.professionalQualifications
              .filter((pq) => assignedResourceIds.has(pq.id))
              .map((pq) => {
                const pqKey = `human_resources-${pq.id}`;
                const pqFields = assignedFields.get(pqKey);
                if (pqFields && pqFields.size > 0) {
                  const normalizeFieldName = (str: string): string => {
                    return str
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '-')
                      .replace(/-+/g, '-')
                      .replace(/^-+|-+$/g, '');
                  };
                  const normalizedProfCert = 'professional-certificate';
                  const isProfCertAssigned = Array.from(pqFields).some(field =>
                    normalizeFieldName(field).includes(normalizedProfCert) ||
                    normalizedProfCert.includes(normalizeFieldName(field))
                  );
                  if (!isProfCertAssigned) {
                    pq.professionalCertificate = null as any;
                  }
                }
                return pq;
              });
          }
          if (hr.trainings) {
            hr.trainings = hr.trainings
              .filter((training) => assignedResourceIds.has(training.id))
              .map((training) => {
                const trainingKey = `human_resources-${training.id}`;
                const trainingFields = assignedFields.get(trainingKey);
                if (trainingFields && trainingFields.size > 0) {
                  const normalizeFieldName = (str: string): string => {
                    return str
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '-')
                      .replace(/-+/g, '-')
                      .replace(/^-+|-+$/g, '');
                  };
                  const normalizedTrainingCert = 'training-certificate';
                  const isTrainingCertAssigned = Array.from(trainingFields).some(field =>
                    normalizeFieldName(field).includes(normalizedTrainingCert) ||
                    normalizedTrainingCert.includes(normalizeFieldName(field))
                  );
                  if (!isTrainingCertAssigned) {
                    training.trainingCertificate = null as any;
                  }
                }
                return training;
              });
          }
          if (hr.professionalExperiences) {
            hr.professionalExperiences = hr.professionalExperiences
              .filter((exp) => assignedResourceIds.has(exp.id))
              .map((exp) => {
                const expKey = `human_resources-${exp.id}`;
                const expFields = assignedFields.get(expKey);
                if (expFields && expFields.size > 0) {
                  const normalizeFieldName = (str: string): string => {
                    return str
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '-')
                      .replace(/-+/g, '-')
                      .replace(/^-+|-+$/g, '');
                  };
                  const normalizedExpLetter = 'experience-letter';
                  const isExpLetterAssigned = Array.from(expFields).some(field =>
                    normalizeFieldName(field).includes(normalizedExpLetter) ||
                    normalizedExpLetter.includes(normalizeFieldName(field))
                  );
                  if (!isExpLetterAssigned) {
                    exp.experienceLetter = null as any;
                  }
                }
                return exp;
              });
          }
          if (hr.declaration && !assignedResourceIds.has(hr.declaration.id)) {
            hr.declaration = null as any;
          }
          return hr;
        }) || [];
    } else {
      application.humanResources = [];
    }

    // Filter checklist (section 8)
    if (assignedSections.has('checklist')) {
      const assignedResourceIds = assignedSections.get('checklist')!;
      if (application.warehouseLocationChecklist) {
        const normalizeFieldName = (str: string): string => {
          return str
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
        };

        // Filter each checklist subsection individually
        if (application.warehouseLocationChecklist.ownershipLegalDocuments && !assignedResourceIds.has(application.warehouseLocationChecklist.ownershipLegalDocuments.id)) {
          application.warehouseLocationChecklist.ownershipLegalDocuments = null as any;
        } else if (application.warehouseLocationChecklist.ownershipLegalDocuments) {
          // Filter ownership documents based on field assignments
          const ownershipKey = `checklist-${application.warehouseLocationChecklist.ownershipLegalDocuments.id}`;
          const ownershipFields = assignedFields.get(ownershipKey);
          if (ownershipFields && ownershipFields.size > 0) {
            // Filter each document field
            const documentFields = [
              { field: 'ownership-deed', doc: 'ownershipDeedDocument' },
              { field: 'mutation-deed', doc: 'mutationDeedDocument' },
              { field: 'noc-nec', doc: 'nocNecDocument' },
              { field: 'factory-layout', doc: 'factoryLayoutDocument' },
              { field: 'lease-agreement', doc: 'leaseAgreementDocument' },
              { field: 'property-warranty', doc: 'propertyWarrantyDocument' },
              { field: 'agreement-undertaking', doc: 'agreementUndertakingDocument' },
            ];
            documentFields.forEach(({ field, doc }) => {
              const isAssigned = Array.from(ownershipFields).some(f =>
                normalizeFieldName(f).includes(field) || field.includes(normalizeFieldName(f))
              );
              if (!isAssigned) {
                (application.warehouseLocationChecklist.ownershipLegalDocuments as any)[doc] = null;
              }
            });
          }
        }

        if (application.warehouseLocationChecklist.humanResourcesKey && !assignedResourceIds.has(application.warehouseLocationChecklist.humanResourcesKey.id)) {
          application.warehouseLocationChecklist.humanResourcesKey = null as any;
        } else if (application.warehouseLocationChecklist.humanResourcesKey) {
          const hrKeyKey = `checklist-${application.warehouseLocationChecklist.humanResourcesKey.id}`;
          const hrKeyFields = assignedFields.get(hrKeyKey);
          if (hrKeyFields && hrKeyFields.size > 0) {
            const documentFields = [
              { field: 'qc-personnel', doc: 'qcPersonnelDocument' },
              { field: 'warehouse-supervisor', doc: 'warehouseSupervisorDocument' },
              { field: 'data-entry-operator', doc: 'dataEntryOperatorDocument' },
            ];
            documentFields.forEach(({ field, doc }) => {
              const isAssigned = Array.from(hrKeyFields).some(f =>
                normalizeFieldName(f).includes(field) || field.includes(normalizeFieldName(f))
              );
              if (!isAssigned) {
                (application.warehouseLocationChecklist.humanResourcesKey as any)[doc] = null;
              }
            });
          }
        }

        if (application.warehouseLocationChecklist.locationRisk && !assignedResourceIds.has(application.warehouseLocationChecklist.locationRisk.id)) {
          application.warehouseLocationChecklist.locationRisk = null as any;
        } else if (application.warehouseLocationChecklist.locationRisk) {
          const locationRiskKey = `checklist-${application.warehouseLocationChecklist.locationRisk.id}`;
          const locationRiskFields = assignedFields.get(locationRiskKey);
          if (locationRiskFields && locationRiskFields.size > 0) {
            const isAssigned = Array.from(locationRiskFields).some(f =>
              normalizeFieldName(f).includes('warehouse-outside-flooding-area') ||
              'warehouse-outside-flooding-area'.includes(normalizeFieldName(f))
            );
            if (!isAssigned) {
              application.warehouseLocationChecklist.locationRisk.warehouseOutsideFloodingAreaDocument = null as any;
            }
          }
        }

        if (application.warehouseLocationChecklist.securityPerimeter && !assignedResourceIds.has(application.warehouseLocationChecklist.securityPerimeter.id)) {
          application.warehouseLocationChecklist.securityPerimeter = null as any;
        } else if (application.warehouseLocationChecklist.securityPerimeter) {
          const securityPerimeterKey = `checklist-${application.warehouseLocationChecklist.securityPerimeter.id}`;
          const securityPerimeterFields = assignedFields.get(securityPerimeterKey);
          if (securityPerimeterFields && securityPerimeterFields.size > 0) {
            const documentFields = [
              { field: 'secured-boundary-wall', doc: 'securedBoundaryWallDocument' },
              { field: 'reinforced-barbed-wire', doc: 'reinforcedBarbedWireDocument' },
              { field: 'fully-gated', doc: 'fullyGatedDocument' },
              { field: 'security-guards-24x7', doc: 'securityGuards24x7Document' },
              { field: 'cctv-cameras', doc: 'cctvCamerasDocument' },
            ];
            documentFields.forEach(({ field, doc }) => {
              const isAssigned = Array.from(securityPerimeterFields).some(f =>
                normalizeFieldName(f).includes(field) || field.includes(normalizeFieldName(f))
              );
              if (!isAssigned) {
                (application.warehouseLocationChecklist.securityPerimeter as any)[doc] = null;
              }
            });
          }
        }

        if (application.warehouseLocationChecklist.infrastructureUtilities && !assignedResourceIds.has(application.warehouseLocationChecklist.infrastructureUtilities.id)) {
          application.warehouseLocationChecklist.infrastructureUtilities = null as any;
        } else if (application.warehouseLocationChecklist.infrastructureUtilities) {
          const infraKey = `checklist-${application.warehouseLocationChecklist.infrastructureUtilities.id}`;
          const infraFields = assignedFields.get(infraKey);
          if (infraFields && infraFields.size > 0) {
            const documentFields = [
              { field: 'functional-weighbridge', doc: 'functionalWeighbridgeDocument' },
              { field: 'sampling-testing-area', doc: 'samplingTestingAreaDocument' },
              { field: 'calibrated-instruments', doc: 'calibratedInstrumentsDocument' },
              { field: 'functional-office', doc: 'functionalOfficeDocument' },
              { field: 'operational-toilets', doc: 'operationalToiletsDocument' },
              { field: 'electricity-gas-utilities', doc: 'electricityGasUtilitiesDocument' },
              { field: 'backup-generator', doc: 'backupGeneratorDocument' },
              { field: 'adequate-residential-arrangements', doc: 'adequateResidentialArrangementsDocument' },
              { field: 'axial-aeration-fans', doc: 'axialAerationFansDocument' },
              { field: 'vents-exhaust-fans', doc: 'ventsExhaustFansDocument' },
              { field: 'technical-drawing', doc: 'technicalDrawingDocument' },
              { field: 'drying-facility', doc: 'dryingFacilityDocument' },
              { field: 'temperature-sensor-cables', doc: 'temperatureSensorCablesDocument' },
            ];
            documentFields.forEach(({ field, doc }) => {
              const isAssigned = Array.from(infraFields).some(f =>
                normalizeFieldName(f).includes(field) || field.includes(normalizeFieldName(f))
              );
              if (!isAssigned) {
                (application.warehouseLocationChecklist.infrastructureUtilities as any)[doc] = null;
              }
            });
          }
        }

        if (application.warehouseLocationChecklist.storageFacilities && !assignedResourceIds.has(application.warehouseLocationChecklist.storageFacilities.id)) {
          application.warehouseLocationChecklist.storageFacilities = null as any;
        } else if (application.warehouseLocationChecklist.storageFacilities) {
          const storageKey = `checklist-${application.warehouseLocationChecklist.storageFacilities.id}`;
          const storageFields = assignedFields.get(storageKey);
          if (storageFields && storageFields.size > 0) {
            const documentFields = [
              { field: 'secured-doors', doc: 'securedDoorsDocument' },
              { field: 'plastered-flooring', doc: 'plasteredFlooringDocument' },
              { field: 'plastered-walls', doc: 'plasteredWallsDocument' },
              { field: 'intact-ceiling', doc: 'intactCeilingDocument' },
              { field: 'functional-windows', doc: 'functionalWindowsDocument' },
              { field: 'protective-netting', doc: 'protectiveNettingDocument' },
              { field: 'functional-exhaust-fans', doc: 'functionalExhaustFansDocument' },
              { field: 'free-from-pests', doc: 'freeFromPestsDocument' },
              { field: 'fire-safety-measures', doc: 'fireSafetyMeasuresDocument' },
            ];
            documentFields.forEach(({ field, doc }) => {
              const isAssigned = Array.from(storageFields).some(f =>
                normalizeFieldName(f).includes(field) || field.includes(normalizeFieldName(f))
              );
              if (!isAssigned) {
                (application.warehouseLocationChecklist.storageFacilities as any)[doc] = null;
              }
            });
          }
        }

        if (application.warehouseLocationChecklist.registrationFee && !assignedResourceIds.has(application.warehouseLocationChecklist.registrationFee.id)) {
          application.warehouseLocationChecklist.registrationFee = null as any;
        } else if (application.warehouseLocationChecklist.registrationFee) {
          const regFeeKey = `checklist-${application.warehouseLocationChecklist.registrationFee.id}`;
          const regFeeFields = assignedFields.get(regFeeKey);
          if (regFeeFields && regFeeFields.size > 0) {
            const isAssigned = Array.from(regFeeFields).some(f =>
              normalizeFieldName(f).includes('bank-payment-slip') ||
              'bank-payment-slip'.includes(normalizeFieldName(f))
            );
            if (!isAssigned) {
              application.warehouseLocationChecklist.registrationFee.bankPaymentSlipDocument = null as any;
            }
          }
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
  async findAllWarehouseLocationRoles(
    userId: string,
    applicationId?: string
  ) {
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

    /**
     * 🔹 1. KYC / application existence check (MISSING EARLIER)
     */
    let isKycVerification = false;

    if (applicationId) {
      const application =
        await this.registrationApplicationRequestRepository.findOne({
          where: { id: applicationId },
          select: { id: true },
        });

      if (application) isKycVerification = true;
    }

    const usersQuery = this.dataSource
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

    /**
     * 🔹 2. Review permissions + Applicant exclusion (MISSING)
     */
    if (
      isKycVerification ||
      hasPermission(user, Permissions.REVIEW_ASSESSMENT) ||
      hasPermission(user, Permissions.REVIEW_FINAL_APPLICATION)
    ) {
      usersQuery.where(`role.name != :applicantRole`, {
        applicantRole: 'Applicant',
      });
    }

    /**
     * 🔹 3. HOD logic with priority permission filtering (MISSING)
     */
    else if (hasPermission(user, Permissions.IS_HOD)) {
      const currentUserPermissions = user.userRoles.flatMap((role) =>
        role.role.rolePermissions.map(
          (permission) => permission.permission.name
        )
      );

      const isHr = currentUserPermissions.includes(Permissions.IS_HR);
      const isFinance = currentUserPermissions.includes(Permissions.IS_FINANCE);
      const isLegal = currentUserPermissions.includes(Permissions.IS_LEGAL);
      const isInspection =
        currentUserPermissions.includes(Permissions.IS_INSPECTION);
      const isSecurity =
        currentUserPermissions.includes(Permissions.IS_SECURITY);
      const isTechnical =
        currentUserPermissions.includes(Permissions.IS_TECHNICAL);
      const isEsg = currentUserPermissions.includes(Permissions.IS_ESG);

      const permissionToFilter = isHr
        ? Permissions.IS_HR
        : isFinance
          ? Permissions.IS_FINANCE
          : isLegal
            ? Permissions.IS_LEGAL
            : isInspection
              ? Permissions.IS_INSPECTION
              : isSecurity
                ? Permissions.IS_SECURITY
                : isTechnical
                  ? Permissions.IS_TECHNICAL
                  : isEsg
                    ? Permissions.IS_ESG
                    : null;

      if (!permissionToFilter) {
        throw new ForbiddenException(
          'User does not have a valid HOD permission'
        );
      }

      if (!user.organization) {
        throw new ForbiddenException('User does not have an organization');
      }

      usersQuery
        .where(
          `permission.name = :expertPermission 
           AND user.organizationId = :organizationId`,
          {
            expertPermission: Permissions.IS_EXPERT,
            organizationId: user.organization.id,
          }
        )
        .andWhere(
          `
          user.id IN (
            SELECT DISTINCT ur2."userId"
            FROM user_roles ur2
            INNER JOIN role_permissions rp2 
              ON rp2."roleId" = ur2."roleId"
            INNER JOIN permissions p2 
              ON p2.id = rp2."permissionId"
            WHERE p2.name = :hodPermission
          )
        `,
          { hodPermission: permissionToFilter }
        );
    }

    /**
     * 🔹 4. Assignment manager logic (UNCHANGED)
     */
    else if (
      hasPermission(user, Permissions.MANAGE_WAREHOUSE_APPLICATION_ASSIGNMENT)
    ) {
      usersQuery.where(`permission.name = :name`, {
        name: Permissions.IS_HOD,
      });
    }

    /**
     * 🔹 5. Exclude already assigned users (MATCHED WITH 1st API)
     */
    if (applicationId && !isKycVerification) {
      usersQuery.andWhere(
        `
        user.id NOT IN (
          SELECT DISTINCT a."assignedTo"
          FROM assignment a
          WHERE a."applicationLocationId" = :applicationId
        )
      `,
        { applicationId }
      );
    }

    usersQuery.groupBy('role.id');
    const users = await usersQuery.getRawMany();

    /**
     * 🔹 6. Deduplicate users per role (MISSING)
     */
    const grouped: Record<string, any[]> = {};

    for (const row of users) {
      const seenUserIds = new Set<string>();
      const uniqueUsers = row.users.filter((u: any) => {
        if (seenUserIds.has(u.id)) return false;
        seenUserIds.add(u.id);
        return true;
      });

      grouped[row.role] = uniqueUsers;
    }

    return grouped;
  }

}
