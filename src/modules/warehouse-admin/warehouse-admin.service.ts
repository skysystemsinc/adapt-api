import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWarehouseAdminDto } from './dto/create-warehouse-admin.dto';
import { UpdateWarehouseAdminDto } from './dto/update-warehouse-admin.dto';
import { QueryOperatorApplicationDto } from './dto/query-operator-application.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { WarehouseOperatorApplicationRequest, WarehouseOperatorApplicationStatus } from '../warehouse/entities/warehouse-operator-application-request.entity';
import { Equal, Not, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { DataSource } from 'typeorm';
import { Permissions } from '../rbac/constants/permissions.constants';
import { hasPermission } from 'src/common/utils/helper.utils';
import { Assignment } from '../warehouse/operator/assignment/entities/assignment.entity';
import { WarehouseDocument } from '../warehouse/entities/warehouse-document.entity';
import { RegistrationApplication } from '../registration-application/entities/registration-application.entity';

@Injectable()
export class WarehouseAdminService {

  constructor(
    @InjectRepository(WarehouseOperatorApplicationRequest)
    private warehouseOperatorApplicationRequestRepository: Repository<WarehouseOperatorApplicationRequest>,
    @InjectRepository(RegistrationApplication)
    private registrationApplicationRequestRepository: Repository<RegistrationApplication>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(WarehouseDocument)
    private warehouseDocumentRepository: Repository<WarehouseDocument>,
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
        'application.metadata',
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

    // For HOD/Expert users: filter to only applications where they have ANY assignment
    // (not just where the latest assignment is to them)
    if (user && (hasPermission(user, Permissions.IS_HOD) || hasPermission(user, Permissions.IS_EXPERT))) {
      queryBuilder.andWhere(
        `application.id IN (
          SELECT DISTINCT a."applicationId" 
          FROM assignment a 
          WHERE a."assignedTo" = :assignedToUserId
        )`,
        { assignedToUserId: userId }
      );
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
        isResubmitted: entity.metadata?.isResubmitted || false,
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
      application.hrs = application.hrs
        ?.filter((hr) => {
          // Check if HR entity ID is assigned (for backward compatibility)
          const hasHrId = assignedResourceIds.has(hr.id);

          // Check if any sub-item is assigned
          const hasPersonalDetails = hr.personalDetails?.id && assignedResourceIds.has(hr.personalDetails.id);
          const hasAcademicQualification = hr.academicQualifications?.some((aq) => assignedResourceIds.has(aq.id));
          const hasProfessionalQualification = hr.professionalQualifications?.some((pq) => assignedResourceIds.has(pq.id));
          const hasTraining = hr.trainings?.some((training) => assignedResourceIds.has(training.id));
          const hasExperience = hr.experiences?.some((exp) => assignedResourceIds.has(exp.id));
          const hasDeclaration = hr.declaration?.id && assignedResourceIds.has(hr.declaration.id);

          // Keep HR if any of its items (including itself) are assigned
          return (
            hasHrId ||
            hasPersonalDetails ||
            hasAcademicQualification ||
            hasProfessionalQualification ||
            hasTraining ||
            hasExperience ||
            hasDeclaration
          );
        })
        ?.map((hr) => {
          const hasPersonalDetails = hr.personalDetails?.id && assignedResourceIds.has(hr.personalDetails.id);
          const preservedName = hr.personalDetails?.name;

          // If personalDetails is not assigned, clear it but preserve the name for card title
          if (!hasPersonalDetails && hr.personalDetails) {
            // Preserve only the name field for display purposes
            hr.personalDetails = {
              id: hr.personalDetails.id,
              name: preservedName || '',
            } as any;
          } else if (hasPersonalDetails && hr.personalDetails) {
            // Check if "Photograph" field is assigned
            const personalDetailsKey = `hrs-${hr.personalDetails.id}`;
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
                hr.personalDetails.photographDocument = null as any;
              }
            }
          }

          // Filter sub-item arrays to only include assigned ones
          if (hr.academicQualifications) {
            hr.academicQualifications = hr.academicQualifications
              .filter((aq) => assignedResourceIds.has(aq.id))
              .map((aq) => {
                const aqKey = `hrs-${aq.id}`;
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
                    aq.academicCertificateDocument = null as any;
                  }
                }
                return aq;
              });
          }
          if (hr.professionalQualifications) {
            hr.professionalQualifications = hr.professionalQualifications
              .filter((pq) => assignedResourceIds.has(pq.id))
              .map((pq) => {
                const pqKey = `hrs-${pq.id}`;
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
                    pq.professionalCertificateDocument = null as any;
                  }
                }
                return pq;
              });
          }
          if (hr.trainings) {
            hr.trainings = hr.trainings
              .filter((training) => assignedResourceIds.has(training.id))
              .map((training) => {
                const trainingKey = `hrs-${training.id}`;
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
                    training.trainingCertificateDocument = null as any;
                  }
                }
                return training;
              });
          }
          if (hr.experiences) {
            hr.experiences = hr.experiences
              .filter((exp) => assignedResourceIds.has(exp.id))
              .map((exp) => {
                const expKey = `hrs-${exp.id}`;
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
                    exp.experienceLetterDocument = null as any;
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
        metadata: true,
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
          taxReturns: true,
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
        const resubmittedSections = warehouseOperatorApplication.metadata?.resubmittedSections || [];
        const resubmittedResourcesBySection = warehouseOperatorApplication.metadata?.resubmittedResourcesBySection || {};

        return {
          ...warehouseOperatorApplication,
          authorizedSignatories: [],
          companyInformation: null,
          bankDetails: null,
          hrs: [],
          financialInformation: null,
          applicantChecklist: null,
          totalCount: 0,
          resubmittedSections,
          resubmittedResourcesBySection,
        };
      }
    }

    // Enrich financial information with polymorphic documents
    if (warehouseOperatorApplication.financialInformation) {
      await this.enrichFinancialInformationWithDocuments(warehouseOperatorApplication.financialInformation);
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

    // Extract resubmitted sections and resourceIds from metadata
    const resubmittedSections = warehouseOperatorApplication.metadata?.resubmittedSections || [];
    const resubmittedResourcesBySection = warehouseOperatorApplication.metadata?.resubmittedResourcesBySection || {};

    return {
      ...warehouseOperatorApplication,
      totalCount,
      resubmittedSections,
      resubmittedResourcesBySection,
    };
  }

  /**
   * Enrich financial information entities with polymorphic documents
   * Adds 'documents' array while keeping 'document' for backward compatibility
   */
  private async enrichFinancialInformationWithDocuments(financialInformation: any) {
    // Enrich audit report with polymorphic documents
    if (financialInformation.auditReport) {
      const auditReportDocuments = await this.warehouseDocumentRepository.find({
        where: {
          documentableType: 'AuditReport',
          documentableId: financialInformation.auditReport.id,
        },
        order: {
          createdAt: 'ASC',
        },
      });

      // Map documents to the expected format
      const documentsArray = auditReportDocuments.map((doc) => ({
        id: doc.id,
        documentId: doc.id,
        originalFileName: doc.originalFileName,
        filePath: doc.filePath,
        mimeType: doc.mimeType,
      }));

      // Add documents array while keeping document for backward compatibility
      (financialInformation.auditReport as any).documents = documentsArray.length > 0 ? documentsArray : undefined;

      // Ensure document field is properly formatted if it exists
      if (financialInformation.auditReport.document) {
        (financialInformation.auditReport.document as any) = {
          id: financialInformation.auditReport.document.id,
          documentId: financialInformation.auditReport.document.id,
          originalFileName: financialInformation.auditReport.document.originalFileName,
          filePath: financialInformation.auditReport.document.filePath,
          mimeType: financialInformation.auditReport.document.mimeType,
        };
      }
    }

    // Enrich tax returns with polymorphic documents
    if (financialInformation.taxReturns && Array.isArray(financialInformation.taxReturns)) {
      for (const taxReturn of financialInformation.taxReturns) {
        const taxReturnDocuments = await this.warehouseDocumentRepository.find({
          where: {
            documentableType: 'TaxReturn',
            documentableId: taxReturn.id,
          },
          order: {
            createdAt: 'ASC',
          },
        });

        // Map documents to the expected format
        const documentsArray = taxReturnDocuments.map((doc) => ({
          id: doc.id,
          documentId: doc.id,
          originalFileName: doc.originalFileName,
          filePath: doc.filePath,
          mimeType: doc.mimeType,
        }));

        // Add documents array while keeping document for backward compatibility
        (taxReturn as any).documents = documentsArray.length > 0 ? documentsArray : undefined;

        // Ensure document field is properly formatted if it exists
        if (taxReturn.document) {
          (taxReturn.document as any) = {
            id: taxReturn.document.id,
            documentId: taxReturn.document.id,
            originalFileName: taxReturn.document.originalFileName,
            filePath: taxReturn.document.filePath,
            mimeType: taxReturn.document.mimeType,
          };
        }
      }
    }
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
  async findAllWareHouseRoles(userId: string, applicationId?: string) {

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

    let isKycVerification: boolean = false;

    if (applicationId) {
      const application = await this.registrationApplicationRequestRepository.findOne({
        where: { id: applicationId },
        select: {
          id: true,
        },
      });

      if (application) isKycVerification = true;
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

    if (isKycVerification || hasPermission(user, Permissions.REVIEW_ASSESSMENT) || hasPermission(user, Permissions.REVIEW_FINAL_APPLICATION)) {
      usersQuery.where(`role.name != :applicantRole`, { applicantRole: 'Applicant' })
    } else if (hasPermission(user, Permissions.IS_HOD)) {
      // get current user's permissions
      const currentUserPermissions = user.userRoles
        .flatMap((role) => role.role.rolePermissions.map((permission) => permission.permission.name));      // check if current user is HR, FINANCE, LEGAL, INSPECTION, SECURITY, TECHNICAL, ESG

      // Check permissions
      const isHr = currentUserPermissions.includes(Permissions.IS_HR);
      const isFinance = currentUserPermissions.includes(Permissions.IS_FINANCE);
      const isLegal = currentUserPermissions.includes(Permissions.IS_LEGAL);
      const isInspection = currentUserPermissions.includes(Permissions.IS_INSPECTION);
      const isSecurity = currentUserPermissions.includes(Permissions.IS_SECURITY);
      const isTechnical = currentUserPermissions.includes(Permissions.IS_TECHNICAL);
      const isEsg = currentUserPermissions.includes(Permissions.IS_ESG);

      // Determine which permission to filter by (priority order)
      const permissionToFilter = isHr ? Permissions.IS_HR :
        isFinance ? Permissions.IS_FINANCE :
          isLegal ? Permissions.IS_LEGAL :
            isInspection ? Permissions.IS_INSPECTION :
              isSecurity ? Permissions.IS_SECURITY :
                isTechnical ? Permissions.IS_TECHNICAL :
                  isEsg ? Permissions.IS_ESG : null;

      if (!permissionToFilter) {
        throw new ForbiddenException('User does not have a valid HOD permission');
      }

      if (user.organization) {
        usersQuery.where(`permission.name = :expertPermission AND user.organizationId = :organizationId`, {
          expertPermission: Permissions.IS_EXPERT,
          organizationId: user.organization.id
        });

        // Ensure user also has the specific HOD permission (IS_HR, IS_FINANCE, etc.)
        usersQuery.andWhere(`user.id IN (
          SELECT DISTINCT ur2."userId"
          FROM user_roles ur2
          INNER JOIN role_permissions rp2 ON rp2."roleId" = ur2."roleId"
          INNER JOIN permissions p2 ON p2.id = rp2."permissionId"
          WHERE p2.name = :hodPermission
        )`, {
          hodPermission: permissionToFilter
        });
      }
      else {
        throw new ForbiddenException('User does not have an organization');
      }
    } else if (hasPermission(user, Permissions.MANAGE_WAREHOUSE_APPLICATION_ASSIGNMENT)) {
      usersQuery.where(`permission.name = :name`, { name: Permissions.IS_HOD })
    }

    // If applicationId is provided, exclude users already assigned to this application
    if (applicationId && !isKycVerification) {
      usersQuery.andWhere(
        `user.id NOT IN (
          SELECT DISTINCT a."assignedTo" 
          FROM assignment a 
          WHERE a."applicationId" = :applicationId
        )`,
        { applicationId }
      );
    }

    usersQuery.groupBy('role.id');
    const users = await usersQuery.getRawMany();

    // Convert to object keyed by role and deduplicate users within each role
    const grouped: Record<string, any[]> = {};
    for (const row of users) {
      // Deduplicate users by user ID within each role group
      // This is especially important for isKycVerification where joins can create duplicates
      const seenUserIds = new Set<string>();
      const uniqueUsers = row.users.filter((user: any) => {
        if (seenUserIds.has(user.id)) {
          return false;
        }
        seenUserIds.add(user.id);
        return true;
      });
      grouped[row.role] = uniqueUsers;
    }

    return grouped;

  }

  private async allInternalUsers() {
    const internalUsers = await this.usersRepository.find({
      where: {
        userRoles: {
          role: {
            name: Not(Equal('Applicant')),
          },
        },
      },
      relations: {
        userRoles: {
          role: {
            rolePermissions: {
              permission: true,
            },
          },
        },
      },
    });


    if (internalUsers.length > 0) {
      const grouped: Record<string, any> = {};
      for (const row of internalUsers) {
        grouped[row.userRoles[0].role.name] = row;
      }
      return grouped;
    }
    return {};
  }
}
