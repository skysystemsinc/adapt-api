import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWarehouseAdminDto } from './dto/create-warehouse-admin.dto';
import { UpdateWarehouseAdminDto } from './dto/update-warehouse-admin.dto';
import { QueryOperatorApplicationDto } from './dto/query-operator-application.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { WarehouseOperatorApplicationRequest, WarehouseOperatorApplicationStatus } from '../warehouse/entities/warehouse-operator-application-request.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { DataSource } from 'typeorm';
import { Permissions } from '../rbac/constants/permissions.constants';
import { hasPermission } from 'src/common/utils/helper.utils';
import { Assignment } from '../warehouse/operator/assignment/entities/assignment.entity';

@Injectable()
export class WarehouseAdminService {

  constructor(
    @InjectRepository(WarehouseOperatorApplicationRequest)
    private warehouseOperatorApplicationRequestRepository: Repository<WarehouseOperatorApplicationRequest>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) { }

  async findAllWareHouseOperatorsPaginated(query: QueryOperatorApplicationDto, userId: string) {
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

      // Check if user has both required permissions
      const hasViewPermission = hasPermission(user, Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT);
      const hasManagePermission = hasPermission(user, Permissions.MANAGE_WAREHOUSE_APPLICATION_ASSIGNMENT);
      const is_hod = hasPermission(user, Permissions.IS_HOD);
      const is_expert = hasPermission(user, Permissions.IS_EXPERT);

      if (!hasViewPermission && !hasManagePermission && !is_hod && !is_expert) {
        throw new ForbiddenException('You do not have permission to view warehouse applications');
      }
    }


    // Subquery to get the latest assignment ID for each application
    // Using raw SQL for correlated subquery
    const latestAssignmentSubquery = `(
      SELECT a.id 
      FROM assignment a 
      WHERE a."applicationId" = application.id 
      ORDER BY a."createdAt" DESC 
      LIMIT 1
    )`;

    const queryBuilder = this.warehouseOperatorApplicationRequestRepository
      .createQueryBuilder('application')
      .leftJoin('application.user', 'user')
      .leftJoin(
        'assignment',
        'assignment',
        `assignment.applicationId = application.id AND assignment.id = ${latestAssignmentSubquery}`
      )
      .select([
        'application.id',
        'application.applicationId',
        'application.applicationType',
        'application.status',
        'application.createdAt',
        'application.updatedAt',
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
      ])
      .addSelect('assignment.level', 'assignmentLevel')
      .addSelect('assignment.assessmentId', 'assignmentAssessmentId')
      .addSelect('assignment.status', 'assignmentStatus');

    queryBuilder.andWhere('application.status != :draftStatus', { draftStatus: WarehouseOperatorApplicationStatus.DRAFT });


    if (user && (hasPermission(user, Permissions.IS_HOD) || hasPermission(user, Permissions.IS_EXPERT))) {
      queryBuilder
        // .innerJoin('assignment', 'assignment', 'assignment.applicationId = application.id')
        .andWhere('assignment.assignedTo = :assignedToUserId', { assignedToUserId: userId });
    }

    if (status) {
      queryBuilder.andWhere('application.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere('user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search', { search: `%${search}%` });
    }

    // Sorting
    queryBuilder.orderBy(`application.${sortBy}`, sortOrder);
    // Also order details by createdAt to maintain consistent order
    queryBuilder.addOrderBy('application.createdAt', 'ASC');

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

    // const firstPendingId = await this.getFirstPendingApplicationId();
    // const enrichedData = data.map((app) =>
    //   this.enrichApplicationWithCalculatedFields(app, firstPendingId)
    // );

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

  private async getFirstPendingApplicationId(): Promise<string | null> {
    const firstPending = await this.warehouseOperatorApplicationRequestRepository.findOne({
      where: { status: WarehouseOperatorApplicationStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
    return firstPending?.id || null;
  }

  create(createWarehouseAdminDto: CreateWarehouseAdminDto) {
    return 'This action adds a new warehouseAdmin';
  }

  findAll() {
    return `This action returns all warehouseAdmin`;
  }

  private filterApplicationByAssignment(
    application: WarehouseOperatorApplicationRequest,
    assignment: Assignment
  ) {
    // Helper function to map sectionType (e.g., "1-authorize-signatory-information") to entity name
    const getEntityNameFromSectionType = (sectionType: string): string | null => {
      // Extract section number from sectionType (e.g., "1" from "1-authorize-signatory-information")
      const match = sectionType.match(/^(\d+)-/);
      if (!match) return null;

      const sectionNumber = match[1];

      // Map section numbers to entity names
      const sectionNumberToEntity: Record<string, string> = {
        '1': 'authorized_signatories',
        '2': 'company_information',
        '3': 'bank_details',
        '4': 'hrs',
        '5': 'financial_information',
        '6': 'applicant_checklist',
      };

      return sectionNumberToEntity[sectionNumber] || null;
    };

    // Create a map of assigned sections by entity name and resourceId
    const assignedSections = new Map<string, Set<string>>();
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

    // Filter authorized signatories
    if (assignedSections.has('authorized_signatories')) {
      const assignedResourceIds = assignedSections.get('authorized_signatories')!;
      application.authorizedSignatories = application.authorizedSignatories?.filter(
        (signatory) => assignedResourceIds.has(signatory.id)
      ) || [];
    } else {
      application.authorizedSignatories = [];
    }

    // Filter company information
    if (!assignedSections.has('company_information')) {
      application.companyInformation = null as any;
    }

    // Filter bank details
    if (!assignedSections.has('bank_details')) {
      application.bankDetails = null as any;
    }

    // Filter HR information
    // Note: HR assignments use sub-item IDs (personalDetails.id, academicQualifications[].id, etc.) as resourceId,
    // not the HR entity ID. So we need to check if any of the HR's sub-items are assigned.
    if (assignedSections.has('hrs')) {
      const assignedResourceIds = assignedSections.get('hrs')!;
      application.hrs = application.hrs?.filter((hr) => {
        // Check if HR entity ID is assigned (for backward compatibility)
        if (assignedResourceIds.has(hr.id)) {
          return true;
        }

        // Check if any sub-item is assigned
        // Personal Details
        if (hr.personalDetails?.id && assignedResourceIds.has(hr.personalDetails.id)) {
          return true;
        }

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

        // Experiences
        if (hr.experiences?.some(exp => assignedResourceIds.has(exp.id))) {
          return true;
        }

        // Declaration
        if (hr.declaration?.id && assignedResourceIds.has(hr.declaration.id)) {
          return true;
        }

        return false;
      }) || [];
    } else {
      application.hrs = [];
    }

    // Filter financial information
    if (assignedSections.has('financial_information')) {
      const assignedResourceIds = assignedSections.get('financial_information')!;
      if (application.financialInformation) {
        // Filter audit report
        if (application.financialInformation.auditReport && !assignedResourceIds.has(application.financialInformation.auditReport.id)) {
          application.financialInformation.auditReport = null as any;
        }
        // Filter tax returns
        if (application.financialInformation.taxReturns) {
          application.financialInformation.taxReturns = application.financialInformation.taxReturns.filter(
            (tr) => assignedResourceIds.has(tr.id)
          );
        }
        // Filter bank statements
        if (application.financialInformation.bankStatements) {
          application.financialInformation.bankStatements = application.financialInformation.bankStatements.filter(
            (bs) => assignedResourceIds.has(bs.id)
          );
        }
        // Filter others
        if (application.financialInformation.others) {
          application.financialInformation.others = application.financialInformation.others.filter(
            (other) => assignedResourceIds.has(other.id)
          );
        }
      }
    } else {
      application.financialInformation = null as any;
    }

    // Filter applicant checklist
    if (assignedSections.has('applicant_checklist')) {
      const assignedResourceIds = assignedSections.get('applicant_checklist')!;
      if (application.applicantChecklist) {
        // Filter each checklist subsection
        if (application.applicantChecklist.humanResources && !assignedResourceIds.has(application.applicantChecklist.humanResources.id)) {
          application.applicantChecklist.humanResources = null as any;
        }
        if (application.applicantChecklist.financialSoundness && !assignedResourceIds.has(application.applicantChecklist.financialSoundness.id)) {
          application.applicantChecklist.financialSoundness = null as any;
        }
        if (application.applicantChecklist.registrationFee && !assignedResourceIds.has(application.applicantChecklist.registrationFee.id)) {
          application.applicantChecklist.registrationFee = null as any;
        }
        if (application.applicantChecklist.declaration && !assignedResourceIds.has(application.applicantChecklist.declaration.id)) {
          application.applicantChecklist.declaration = null as any;
        }
      }
    } else {
      application.applicantChecklist = null as any;
    }
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

    const warehouseOperatorApplication = await this.warehouseOperatorApplicationRequestRepository.findOne({
      where: { id },
      select: {
        id: true,
        status: true,
        applicationId: true,
        user: true,
        companyInformation: true,
        financialInformation: true,
        bankDetails: true,
        authorizedSignatories: true,
        hrs: true,
        applicantChecklist: true,
      },
      relations: {
        user: true,
        authorizedSignatories: true,
        companyInformation: {
          ntcCertificate: true,
        },
        bankDetails: true,
        hrs: {
          personalDetails: {
            photographDocument: true,
            designation: true,
          },
          academicQualifications: {
            academicCertificateDocument: true,
          },
          professionalQualifications: {
            professionalCertificateDocument: true,
          },
          trainings: {
            trainingCertificateDocument: true,
          },
          experiences: {
            experienceLetterDocument: true,
          },
          declaration: true,
        },
        financialInformation: {
          auditReport: true,
          taxReturns: {
            document: true,
          },
          bankStatements: {
            document: true,
          },
          others: {
            document: true,
          },
        },
        applicantChecklist: {
          humanResources: {
            qcPersonnelDocument: true, 
            warehouseSupervisorDocument: true, 
            dataEntryOperatorDocument: true, 
          },
          financialSoundness: {
            auditedFinancialStatementsDocument: true, 
            positiveNetWorthDocument: true, 
            noLoanDefaultsDocument: true, 
            cleanCreditHistoryDocument: true, 
            adequateWorkingCapitalDocument: true, 
            validInsuranceCoverageDocument: true, 
            noFinancialFraudDocument: true, 
          },
          registrationFee: {
            bankPaymentSlipDocument: true, 
          },
          declaration: true,
        },
      }
    });

    if (!warehouseOperatorApplication) {
      throw new NotFoundException('Warehouse operator application not found');
    }

    if (user && (hasPermission(user, Permissions.IS_HOD) || hasPermission(user, Permissions.IS_EXPERT))) {
      // Fetch assignment for this user and application
      const assignment = await this.dataSource.getRepository(Assignment).findOne({
        where: {
          applicationId: id,
          assignedTo: userId,
        },
        relations: ['sections', 'sections.fields'],
      });

      if (assignment && assignment.sections) {
        this.filterApplicationByAssignment(warehouseOperatorApplication, assignment);
      } else {
        // If no assignment found, return empty data for HOD
        return {
          ...warehouseOperatorApplication,
          authorizedSignatories: [],
          companyInformation: null,
          bankDetails: null,
          hrs: [],
          financialInformation: null,
          applicantChecklist: null,
          totalCount: 0,
        };
      }
    }

    const totalCount =
      (warehouseOperatorApplication.authorizedSignatories?.length || 0) +
      (warehouseOperatorApplication.hrs?.length || 0) +
      (warehouseOperatorApplication.financialInformation?.auditReport ? 1 : 0) +
      (warehouseOperatorApplication.financialInformation?.taxReturns?.length || 0) +
      (warehouseOperatorApplication.financialInformation?.bankStatements?.length || 0) +
      (warehouseOperatorApplication.financialInformation?.others?.length || 0) +
      (warehouseOperatorApplication.companyInformation ? 1 : 0) +
      (warehouseOperatorApplication.bankDetails ? 1 : 0) +
      (warehouseOperatorApplication.applicantChecklist?.humanResources ? 1 : 0) +
      (warehouseOperatorApplication.applicantChecklist?.financialSoundness ? 1 : 0) +
      (warehouseOperatorApplication.applicantChecklist?.registrationFee ? 1 : 0) +
      (warehouseOperatorApplication.applicantChecklist?.declaration ? 1 : 0);

    return {
      ...warehouseOperatorApplication,
      totalCount,
    };
  }

  update(id: number, updateWarehouseAdminDto: UpdateWarehouseAdminDto) {
    return `This action updates a #${id} warehouseAdmin`;
  }

  remove(id: number) {
    return `This action removes a #${id} warehouseAdmin`;
  }

  /**
   * 
   * @returns All users grouped by role
   */
  async findAllWareHouseRoles(userId: string) {

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

    console.log('user has roles: ', user?.organization?.id);

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
      }
      else {
        throw new ForbiddenException('User does not have an organization');
      }
    } else if (hasPermission(user, Permissions.MANAGE_WAREHOUSE_APPLICATION_ASSIGNMENT)) {
      usersQuery.where(`permission.name = :name`, { name: Permissions.IS_HOD })
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
