import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizedSignatoryDto, CreateCompanyInformationRequestDto, CreateBankDetailsDto, CreateWarehouseOperatorApplicationRequestDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { WarehouseOperatorApplicationRequest, WarehouseOperatorApplicationStatus } from './entities/warehouse-operator-application-request.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthorizedSignatory } from './entities/authorized-signatories.entity';
import { CompanyInformation } from './entities/company-information.entity';
import { WarehouseDocument } from './entities/warehouse-document.entity';
import { HrEntity } from './entities/hr.entity';
import { PersonalDetailsEntity } from './entities/hr/personal-details.entity/personal-details.entity';
import { AcademicQualificationsEntity } from './entities/hr/academic-qualifications.entity/academic-qualifications.entity';
import { ProfessionalQualificationsEntity } from './entities/hr/professional-qualifications.entity/professional-qualifications.entity';
import { TrainingsEntity } from './entities/hr/trainings.entity/trainings.entity';
import { ExperienceEntity } from './entities/hr/experience.entity/experience.entity';
import { DeclarationEntity } from './entities/hr/declaration.entity/declaration.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { StepStatus } from './entities/bank-details.entity';
import { BankDetails } from './entities/bank-details.entity';
import { UpsertHrInformationDto, HrPersonalDetailsDto, HrDeclarationDto, HrAcademicQualificationDto, HrProfessionalQualificationDto, HrTrainingDto, HrExperienceDto } from './dto/create-hr-information.dto';
import { Designation } from '../common/entities/designation.entity';
import { AccountType, UpdateBankDetailsDto } from './dto/create-bank-details.dto';
import { FinancialInformationEntity } from './entities/financial-information.entity';
import { AuditReportEntity } from './entities/financial/audit-report.entity';
import { TaxReturnEntity } from './entities/financial/tax-return.entity';
import { BankStatementEntity } from './entities/financial/bank-statement.entity';
import { OthersEntity } from './entities/financial/others.entity';
import { CreateFinancialInformationDto, OthersDto } from './dto/create-financial-information.dto';
import { CreateApplicantChecklistDto } from './dto/create-applicant-checklist.dto';
import { ApplicantChecklistEntity } from './entities/applicant-checklist.entity';
import { FinancialSoundnessChecklistEntity } from './entities/checklist/financial-soundness.entity';
import { DeclarationChecklistEntity } from './entities/checklist/declaration.entity';
import { HumanResourcesChecklistEntity } from './entities/checklist/human-resources.entity';
import { RegistrationFeeChecklistEntity } from './entities/checklist/registration-fee.entity';
import { ListWarehouseOperatorApplicationDto } from './dto/list-warehouse.dto';
import { CreateAuthorizedSignatoryDto } from './dto/create-authorized-signatory.dto';
import { forwardRef, Inject } from '@nestjs/common';
import { FinancialInformationService } from './financial-information.service';
import { WarehouseOperator } from './entities/warehouse-operator.entity';
import { ResubmitOperatorApplicationDto } from './dto/resubmit-warehouse.dto';
import { Assignment, AssignmentLevel, AssignmentStatus } from './operator/assignment/entities/assignment.entity';
import { AssignmentSection } from './operator/assignment/entities/assignment-section.entity';
import { AssignmentSectionField } from './operator/assignment/entities/assignment-section-field.entity';
import { AssignmentHistory } from './operator/assignment/entities/assignment-history.entity';
import { AssignmentSectionHistory } from './operator/assignment/entities/assignment-section-history.entity';
import { AssignmentSectionFieldHistory } from './operator/assignment/entities/assignment-section-field-history.entity';
import { AuthorizedSignatoryHistory } from './entities/authorized-signatories-history.entity';
import { CompanyInformationHistory } from './entities/company-information-history.entity';
import { BankDetailsHistory } from './entities/bank-details-history.entity';
import { PersonalDetailsHistoryEntity } from './entities/hr/personal-details.entity/personal-details-history.entity';
import { AcademicQualificationsHistoryEntity } from './entities/hr/academic-qualifications.entity/academic-qualifications-history.entity';
import { DeclarationHistoryEntity } from './entities/hr/declaration.entity/declaration-history.entity';
import { ProfessionalQualificationsHistoryEntity } from './entities/hr/professional-qualifications.entity/professional-qualifications-history.entity';
import { TrainingsHistoryEntity } from './entities/hr/trainings.entity/trainings-history.entity';
import { ExperienceHistoryEntity } from './entities/hr/experience.entity/experience-history.entity';
import { FinancialInformationHistoryEntity } from './entities/financial-information-history.entity';
import { AuditReportHistoryEntity } from './entities/financial/audit-report-history.entity';
import { TaxReturnHistoryEntity } from './entities/financial/tax-return-history.entity';
import { BankStatementHistoryEntity } from './entities/financial/bank-statement-history.entity';
import { OthersHistoryEntity } from './entities/financial/others-history.entity';
import { ResubmittedSectionEntity } from './entities/resubmitted-section.entity';
import { ApplicationRejectionEntity } from './entities/application-rejection.entity';
import { ApplicationRejectionHistoryEntity } from './entities/application-rejection-history.entity';
import { ApplicantChecklistHistoryEntity } from './entities/applicant-checklist-history.entity';
import { RegistrationApplication } from '../registration-application/entities/registration-application.entity';
import { RegistrationApplicationDetails } from '../registration-application/entities/registration-application-details.entity';
import { FormField } from '../forms/entities/form-field.entity';
import { WarehouseLocation } from '../warehouse-location/entities/warehouse-location.entity';

export class WarehouseService {
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(WarehouseOperatorApplicationRequest)
    private readonly warehouseOperatorRepository: Repository<WarehouseOperatorApplicationRequest>,
    @InjectRepository(AuthorizedSignatory)
    private readonly authorizedSignatoryRepository: Repository<AuthorizedSignatory>,
    @InjectRepository(CompanyInformation)
    private readonly companyInformationRepository: Repository<CompanyInformation>,
    @InjectRepository(WarehouseDocument)
    private readonly warehouseDocumentRepository: Repository<WarehouseDocument>,
    @InjectRepository(BankDetails)
    private readonly bankDetailsRepository: Repository<BankDetails>,
    @InjectRepository(HrEntity)
    private readonly hrRepository: Repository<HrEntity>,
    @InjectRepository(Designation)
    private readonly designationRepository: Repository<Designation>,
    @InjectRepository(FinancialInformationEntity)
    private readonly financialInformationRepository: Repository<FinancialInformationEntity>,
    @InjectRepository(ApplicantChecklistEntity)
    private readonly applicantChecklistRepository: Repository<ApplicantChecklistEntity>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => FinancialInformationService))
    private readonly financialInformationService: FinancialInformationService,
    @InjectRepository(WarehouseOperator)
    private readonly warehouseOperatorsRepository: Repository<WarehouseOperator>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(AssignmentSection)
    private readonly assignmentSectionRepository: Repository<AssignmentSection>,
    @InjectRepository(AuthorizedSignatoryHistory)
    private readonly authorizedSignatoryHistoryRepository: Repository<AuthorizedSignatoryHistory>,
    @InjectRepository(CompanyInformationHistory)
    private readonly companyInformationHistoryRepository: Repository<CompanyInformationHistory>,
    @InjectRepository(BankDetailsHistory)
    private readonly bankDetailsHistoryRepository: Repository<BankDetailsHistory>,
    @InjectRepository(PersonalDetailsHistoryEntity)
    private readonly personalDetailsHistoryRepository: Repository<PersonalDetailsHistoryEntity>,
    @InjectRepository(AcademicQualificationsHistoryEntity)
    private readonly academicQualificationsHistoryRepository: Repository<AcademicQualificationsHistoryEntity>,
    @InjectRepository(DeclarationHistoryEntity)
    private readonly declarationHistoryRepository: Repository<DeclarationHistoryEntity>,
    @InjectRepository(ProfessionalQualificationsHistoryEntity)
    private readonly professionalQualificationsHistoryRepository: Repository<ProfessionalQualificationsHistoryEntity>,
    @InjectRepository(TrainingsHistoryEntity)
    private readonly trainingsHistoryRepository: Repository<TrainingsHistoryEntity>,
    @InjectRepository(ResubmittedSectionEntity)
    private readonly resubmittedSectionRepository: Repository<ResubmittedSectionEntity>,
    @InjectRepository(RegistrationApplication)
    private readonly registrationApplicationRepository: Repository<RegistrationApplication>,
    @InjectRepository(RegistrationApplicationDetails)
    private readonly registrationApplicationDetailsRepository: Repository<RegistrationApplicationDetails>,
    @InjectRepository(FormField)
    private readonly formFieldRepository: Repository<FormField>,
  ) {
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  async listWarehouseOperatorApplication(userId: string, dto: ListWarehouseOperatorApplicationDto) {
    const { search, page, limit, sortBy, sortOrder } = dto;
    const query = this.warehouseOperatorRepository.createQueryBuilder('warehouseOperatorApplication');
    query.where('warehouseOperatorApplication.userId = :userId', { userId });
    if (search) {
      query.andWhere('warehouseOperatorApplication.name LIKE :search', { search: `%${search}%` });
    }

    // Load relations needed for progress calculation
    query.leftJoinAndSelect('warehouseOperatorApplication.authorizedSignatories', 'authorizedSignatories');
    query.leftJoinAndSelect('warehouseOperatorApplication.companyInformation', 'companyInformation');
    query.leftJoinAndSelect('warehouseOperatorApplication.bankDetails', 'bankDetails');
    query.leftJoinAndSelect('warehouseOperatorApplication.hrs', 'hrs');
    query.leftJoinAndSelect('warehouseOperatorApplication.financialInformation', 'financialInformation');
    query.leftJoinAndSelect('warehouseOperatorApplication.applicantChecklist', 'applicantChecklist');

    query.leftJoinAndSelect(
      'warehouse_operators',
      'warehouseOperator',
      'warehouseOperator.applicationId = warehouseOperatorApplication.id'
    );

    query.orderBy(`warehouseOperatorApplication.${sortBy}`, sortOrder);
    query.skip(((page ?? 1) - 1) * (limit ?? 10));
    query.take(limit ?? 10);
    const [applications, total] = await query.getManyAndCount();

    // Calculate progress and include approval info
    const applicationsWithProgress = await Promise.all(
      applications.map(async (application) => {
        const progress = this.calculateApplicationProgress(application);

        let approvalInfo = null;
        if (application.status === WarehouseOperatorApplicationStatus.APPROVED) {
          // Query WarehouseOperator for this application
          const warehouseOperator = await this.warehouseOperatorsRepository.findOne({
            where: { applicationId: application.id },
            select: ['approvedByFullName', 'approvedByDesignation', 'approvedAt', 'dateOfAssessment']
          });

          if (warehouseOperator) {
            approvalInfo = {
              approvedByFullName: warehouseOperator.approvedByFullName,
              approvedByDesignation: warehouseOperator.approvedByDesignation,
              approvedAt: warehouseOperator.approvedAt,
              dateOfAssessment: warehouseOperator.dateOfAssessment,
            };
          }
        }

        return {
          ...application,
          progress,
          approvalInfo,
        };
      })
    );

    return {
      applications: applicationsWithProgress,
      total,
      page: page ?? 1,
      limit: limit ?? 10,
      sortBy: sortBy ?? 'createdAt',
      sortOrder: sortOrder ?? 'DESC',
    };
  }

  private calculateApplicationProgress(application: WarehouseOperatorApplicationRequest): number {
    // Define the main sections that need to be completed
    const totalSections = 6;
    let completedSections = 0;

    // 1. Check Authorized Signatories (at least one required)
    if (application.authorizedSignatories && application.authorizedSignatories.length > 0) {
      completedSections++;
    }

    // 2. Check Company Information
    if (application.companyInformation) {
      completedSections++;
    }

    // 3. Check Bank Details
    if (application.bankDetails) {
      completedSections++;
    }

    // 4. Check HR Information (at least one required)
    if (application.hrs && application.hrs.length > 0) {
      completedSections++;
    }

    // 5. Check Financial Information
    if (application.financialInformation) {
      completedSections++;
    }

    // 6. Check Applicant Checklist
    if (application.applicantChecklist) {
      completedSections++;
    }

    // Calculate progress percentage
    const progress = Math.round((completedSections / totalSections) * 100);

    // If status is not DRAFT, return 100% for submitted/approved applications
    if (application.status !== WarehouseOperatorApplicationStatus.DRAFT) {
      return 100;
    }

    return progress;
  }

  async createOperatorApplication(
    createWarehouseDto: CreateWarehouseOperatorApplicationRequestDto,
    userId: string
  ) {
    const application = await this.warehouseOperatorRepository.find({ where: { userId } });

    if (application && application.length > 0) {
      if (application[0].status === WarehouseOperatorApplicationStatus.DRAFT) {
        return {
          message: 'You are already a warehouse operator in draft status. Please update your application instead of creating a new one.',
        };
      } else if ([WarehouseOperatorApplicationStatus.IN_PROCESS,
      WarehouseOperatorApplicationStatus.PENDING,
      WarehouseOperatorApplicationStatus.APPROVED,
      WarehouseOperatorApplicationStatus.SUBMITTED
      ]
        .includes(application[0].status)) {
        return {
          message: 'Your warehouse operator application is being reviewed. Please contact the admin to update your application.',
        };
      }
    }

    let warehouseOperatorApplication: WarehouseOperatorApplicationRequest | undefined;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const newApplication = this.warehouseOperatorRepository.create({
          applicationId: await this.generateApplicationId(),
          userId,
          status: WarehouseOperatorApplicationStatus.DRAFT
        });

        warehouseOperatorApplication = await this.warehouseOperatorRepository.save(newApplication);
        break; // Success, exit loop
      } catch (error: any) {
        // Check if it's a unique constraint violation on applicationId
        if (error?.code === '23505' && error?.constraint === 'UQ_b98b2292d2ddaa311612788ef7c') {
          attempts++;
          if (attempts >= maxAttempts) {
            throw new BadRequestException('Failed to generate unique application ID. Please try again.');
          }
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 100 * attempts));
        } else {
          // Re-throw if it's a different error
          throw error;
        }
      }
    }

    if (!warehouseOperatorApplication) {
      throw new BadRequestException('Failed to create warehouse operator application. Please try again.');
    }

    const authorizedSignatories = createWarehouseDto.authorizedSignatories.map((authorizedSignatory: AuthorizedSignatoryDto) => {
      return this.authorizedSignatoryRepository.save({
        warehouseOperatorApplicationRequestId: warehouseOperatorApplication.id,
        authorizedSignatoryName: authorizedSignatory.authorizedSignatoryName,
        name: authorizedSignatory.name,
        cnic: authorizedSignatory.cnic.toString(),
        passport: authorizedSignatory.passport,
        issuanceDateOfCnic: authorizedSignatory.issuanceDateOfCnic,
        expiryDateOfCnic: authorizedSignatory.expiryDateOfCnic,
        mailingAddress: authorizedSignatory.mailingAddress,
        city: authorizedSignatory.city,
        country: authorizedSignatory.country,
        postalCode: authorizedSignatory.postalCode,
        designation: authorizedSignatory.designation,
        mobileNumber: authorizedSignatory.mobileNumber,
        email: authorizedSignatory.email,
        landlineNumber: authorizedSignatory.landlineNumber,
      });
    });

    await Promise.all(authorizedSignatories);

    return {
      message: 'Warehouse authorized signatories saved successfully',
      warehouseOperatorApplicationRequestId: warehouseOperatorApplication.applicationId,
    };
  }

  async resubmitOperatorApplication(resubmitOperatorApplicationDto: ResubmitOperatorApplicationDto, userId: string) {
    const application = await this.warehouseOperatorRepository.findOne({ where: { userId } });
    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }
    if (application.status !== WarehouseOperatorApplicationStatus.REJECTED) {
      throw new BadRequestException('Application is not in rejected status.');
    }

    const rejections = application.rejections;
    if (rejections.length === 0) {
      throw new BadRequestException('No rejection found.');
    }

    const __unlockedSections = rejections.map((rejection) => rejection.unlockedSections).flat();
    if (__unlockedSections.length === 0) {
      throw new BadRequestException('No unlocked sections found.');
    }

    //unlocked sections is jsonb array of strings
    const unlockedSections = __unlockedSections.map((section) => JSON.parse(section));
    if (unlockedSections.length === 0) {
      throw new BadRequestException('No unlocked sections found.');
    }




  }

  async getApplicationEntityById(
    entityType: string,
    entityId: string,
  ) {
    switch (entityType) {
      case 'authorized_signatories':
        return this.getAuthorizedSignatoryData(entityId);

      case 'company_information':
        return this.getCompanyInformationData(entityId);

      case 'bank_details':
        return this.getBankDetailsData(entityId);

      case 'hrs':
        return this.getHrInformationData(entityId);

      case 'financial_information':
        return this.getFinancialInformationData(entityId);

      case 'applicant_checklist':
        return this.getApplicantChecklistData(entityId);

      default:
        throw new BadRequestException('Invalid entity type');
    }
  }

  async createAuthorizedSignatory(id: string, createAuthorizedSignatoryDto: CreateAuthorizedSignatoryDto, userId: string) {
    const application = await this.warehouseOperatorRepository.findOne({ where: { id, userId } });
    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }
    const authorizedSignatory = this.authorizedSignatoryRepository.create({
      warehouseOperatorApplicationRequestId: application.id,
      authorizedSignatoryName: createAuthorizedSignatoryDto.authorizedSignatoryName,
      name: createAuthorizedSignatoryDto.name,
      cnic: createAuthorizedSignatoryDto.cnic.toString(),
      passport: createAuthorizedSignatoryDto.passport,
      issuanceDateOfCnic: createAuthorizedSignatoryDto.issuanceDateOfCnic,
      expiryDateOfCnic: createAuthorizedSignatoryDto.expiryDateOfCnic,
      mailingAddress: createAuthorizedSignatoryDto.mailingAddress,
      city: createAuthorizedSignatoryDto.city,
      country: createAuthorizedSignatoryDto.country,
      postalCode: createAuthorizedSignatoryDto.postalCode,
      designation: createAuthorizedSignatoryDto.designation,
      mobileNumber: createAuthorizedSignatoryDto.mobileNumber,
      email: createAuthorizedSignatoryDto.email,
      landlineNumber: createAuthorizedSignatoryDto.landlineNumber || '',
    });
    const saved = await this.authorizedSignatoryRepository.save(authorizedSignatory);
    return {
      message: 'Authorized signatory saved successfully',
      authorizedSignatoryId: saved.id,
      applicationId: application.applicationId,
    };
  }

  private async getAuthorizedSignatoryData(authorizedSignatoryId: string) {
    const authorizedSignatory = await this.authorizedSignatoryRepository.findOne({
      where: { id: authorizedSignatoryId },
    });

    if (!authorizedSignatory) {
      throw new NotFoundException('Authorized Signatory not found');
    }

    const {
      id,
      warehouseOperatorApplicationRequestId,
      isActive,
      createdAt,
      updatedAt,
      ...cleanData
    } = authorizedSignatory;

    return {
      message: 'Authorized Signatory retrieved successfully',
      data: cleanData
    };
  }

  private async getHrInformationData(hrInformationId: string) {
    const hrInformation = await this.hrRepository.findOne({
      where: { id: hrInformationId },
      relations: ['personalDetails', 'academicQualifications', 'professionalQualifications', 'trainings', 'experiences', 'declaration']
    });

    if (!hrInformation) {
      throw new NotFoundException('HR information not found');
    }

    const {
      id,
      isActive,
      createdAt,
      updatedAt,
      applicationId,
      declarationId,
      personalDetailsId,
      ...cleanData
    } = hrInformation;

    return {
      message: 'HR information retrieved successfully',
      data: cleanData
    };
  }

  private async getFinancialInformationData(financialInformationId: string) {
    const financialInformation = await this.financialInformationRepository.findOne({
      where: { id: financialInformationId },
      relations: ['auditReport', 'taxReturns', 'bankStatements', 'others']
    });

    if (!financialInformation) {
      throw new NotFoundException('Financial information not found');
    }

    const {
      id,
      isActive,
      createdAt,
      updatedAt,
      auditReportId,
      applicationId,
      ...cleanData
    } = financialInformation;

    return {
      message: 'Financial information retrieved successfully',
      data: cleanData
    };
  }

  private async getApplicantChecklistData(applicantChecklistId: string) {
    const applicantChecklist = await this.applicantChecklistRepository.findOne({
      where: { id: applicantChecklistId },
      relations: ['humanResources', 'financialSoundness', 'registrationFee', 'declaration']
    });

    if (!applicantChecklist) {
      throw new NotFoundException('Applicant Checklist not found');
    }

    const {
      id,
      isActive,
      createdAt,
      updatedAt,
      ...cleanData
    } = applicantChecklist;

    return {
      message: 'Applicant Checklist retrieved successfully',
      data: cleanData
    };
  }

  async updateAuthorizedSignatory(
    authorizedSignatoryId: string,
    updateAuthorizedSignatoryDto: CreateAuthorizedSignatoryDto,
    userId: string
  ) {
    // First, validate the record exists and user has access (outside transaction for early validation)
    const authorizedSignatory = await this.authorizedSignatoryRepository.findOne({
      where: { id: authorizedSignatoryId },
      relations: ['warehouseOperatorApplicationRequest'],
    });

    if (!authorizedSignatory) {
      throw new NotFoundException('Authorized signatory not found');
    }

    const application = authorizedSignatory.warehouseOperatorApplicationRequest;
    if (!application || application.userId !== userId) {
      throw new NotFoundException('Authorized signatory not found or access denied');
    }

    // Validate application status allows updates
    if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(application.status)) {
      throw new BadRequestException('Cannot update authorized signatory after application is approved or submitted');
    }

    // Use transaction to ensure atomicity: history save and update must both succeed or both fail
    const result = await this.dataSource.transaction(async (manager) => {
      const signatoryRepo = manager.getRepository(AuthorizedSignatory);
      const historyRepo = manager.getRepository(AuthorizedSignatoryHistory);

      // Reload within transaction to ensure we have the latest data
      const signatory = await signatoryRepo.findOne({
        where: { id: authorizedSignatoryId },
        relations: ['warehouseOperatorApplicationRequest'],
      });

      if (!signatory) {
        throw new NotFoundException('Authorized signatory not found');
      }

      const appInTransaction = signatory.warehouseOperatorApplicationRequest;
      if (!appInTransaction || appInTransaction.userId !== userId) {
        throw new NotFoundException('Authorized signatory not found or access denied');
      }

      // Re-validate application status inside transaction to prevent race conditions
      if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(appInTransaction.status)) {
        throw new BadRequestException('Cannot update authorized signatory after application is approved or submitted');
      }

      // Save history of authorized signatory if application is rejected (before overwriting)
      if (appInTransaction.status === WarehouseOperatorApplicationStatus.REJECTED) {
        const historyRecord = historyRepo.create({
          authorizedSignatoryId: signatory.id,
          warehouseOperatorApplicationRequestId: signatory.warehouseOperatorApplicationRequestId,
          name: signatory.name,
          authorizedSignatoryName: signatory.authorizedSignatoryName,
          cnic: signatory.cnic,
          passport: signatory.passport,
          issuanceDateOfCnic: signatory.issuanceDateOfCnic,
          expiryDateOfCnic: signatory.expiryDateOfCnic,
          mailingAddress: signatory.mailingAddress,
          city: signatory.city,
          country: signatory.country,
          postalCode: signatory.postalCode,
          designation: signatory.designation,
          mobileNumber: signatory.mobileNumber,
          email: signatory.email,
          landlineNumber: signatory.landlineNumber,
          isActive: false,
        });

        // Preserve the original createdAt timestamp from the authorized signatory record
        historyRecord.createdAt = signatory.createdAt;

        await historyRepo.save(historyRecord);
      }

      // Overwrite existing authorized signatory with new information
      signatory.authorizedSignatoryName = updateAuthorizedSignatoryDto.authorizedSignatoryName;
      signatory.name = updateAuthorizedSignatoryDto.name;
      signatory.cnic = updateAuthorizedSignatoryDto.cnic.toString();
      signatory.passport = updateAuthorizedSignatoryDto.passport ?? '';
      signatory.issuanceDateOfCnic = updateAuthorizedSignatoryDto.issuanceDateOfCnic;
      signatory.expiryDateOfCnic = updateAuthorizedSignatoryDto.expiryDateOfCnic;
      signatory.mailingAddress = updateAuthorizedSignatoryDto.mailingAddress;
      signatory.city = updateAuthorizedSignatoryDto.city;
      signatory.country = updateAuthorizedSignatoryDto.country;
      signatory.postalCode = updateAuthorizedSignatoryDto.postalCode;
      signatory.designation = updateAuthorizedSignatoryDto.designation;
      signatory.mobileNumber = updateAuthorizedSignatoryDto.mobileNumber;
      signatory.email = updateAuthorizedSignatoryDto.email;
      signatory.landlineNumber = updateAuthorizedSignatoryDto.landlineNumber ?? '';

      const updated = await signatoryRepo.save(signatory);

      return {
        signatory: updated,
        applicationId: appInTransaction.applicationId,
        appId: appInTransaction.id,
      };
    });

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseOperatorRepository.findOne({
      where: { id: result.appId },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for authorized signatory if it exists
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationId: result.appId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '1-authorize-signatory-information',
            resourceId: authorizedSignatoryId,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      await this.trackResubmissionAndUpdateStatus(
        result.appId,
        '1-authorize-signatory-information',
        authorizedSignatoryId,
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: 'Authorized signatory updated successfully',
      authorizedSignatoryId: result.signatory.id,
      applicationId: result.appId,
    };
  }

  async deleteAuthorizedSignatory(authorizedSignatoryId: string, userId: string) {
    const authorizedSignatory = await this.authorizedSignatoryRepository.findOne({
      where: { id: authorizedSignatoryId },
      relations: ['warehouseOperatorApplicationRequest'],
    });

    if (!authorizedSignatory) {
      throw new NotFoundException('Authorized signatory not found');
    }

    const application = authorizedSignatory.warehouseOperatorApplicationRequest;
    if (!application || application.userId !== userId) {
      throw new NotFoundException('Authorized signatory not found or access denied');
    }

    if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(application.status)) {
      throw new BadRequestException('Cannot delete authorized signatory after application is approved or submitted');
    }

    await this.authorizedSignatoryRepository.remove(authorizedSignatory);

    return {
      message: 'Authorized signatory deleted successfully',
    };
  }

  async createCompanyInformation(
    createCompanyInformationDto: CreateCompanyInformationRequestDto,
    userId: string,
    applicationId: string,
    ntcCertificateFile?: any
  ) {
    // Find existing warehouse operator application for this user
    const existingApplication = await this.warehouseOperatorRepository.findOne({
      where: { userId, id: applicationId },
      order: { createdAt: 'DESC' }
    });

    if (!existingApplication) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    // Check if company information already exists for this application
    const existingCompanyInfo = await this.companyInformationRepository.findOne({
      where: { applicationId: existingApplication.id }
    });

    if (existingCompanyInfo) {
      throw new BadRequestException('Company information already exists for this application. Please update instead of creating a new one.');
    }

    // Create company information
    const newCompanyInformation = this.companyInformationRepository.create({
      applicationId: existingApplication.id, // Use the UUID id, not applicationId string
      companyName: createCompanyInformationDto.companyName,
      secpRegistrationNumber: createCompanyInformationDto.secpRegistrationNumber,
      activeFilerStatus: createCompanyInformationDto.activeFilerStatus,
      dateOfIncorporation: createCompanyInformationDto.dateOfIncorporation,
      businessCommencementDate: createCompanyInformationDto.businessCommencementDate,
      registeredOfficeAddress: createCompanyInformationDto.registeredOfficeAddress,
      postalCode: createCompanyInformationDto.postalCode,
      nationalTaxNumber: createCompanyInformationDto.nationalTaxNumber,
      salesTaxRegistrationNumber: createCompanyInformationDto.salesTaxRegistrationNumber,
    });

    const savedCompanyInformation = await this.companyInformationRepository.save(newCompanyInformation);

    // If ntcCertificate file is provided, upload it and link to company information
    let ntcCertificateDocumentId: string | undefined;
    if (ntcCertificateFile) {
      const documentResult = await this.uploadWarehouseDocument(
        ntcCertificateFile,
        userId,
        'CompanyInformation',
        savedCompanyInformation.id,
        'ntcCertificate'
      );
      ntcCertificateDocumentId = documentResult.id;

      // Update company information with the ntcCertificate foreign key
      // Load the document entity and assign it to the company information
      const ntcCertificateDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: ntcCertificateDocumentId }
      });

      if (ntcCertificateDocument) {
        savedCompanyInformation.ntcCertificate = ntcCertificateDocument;
        await this.companyInformationRepository.save(savedCompanyInformation);
      }
    }

    return {
      message: 'Company information saved successfully',
      companyInformationId: savedCompanyInformation.id,
      applicationId: existingApplication.applicationId,
      ntcCertificate: ntcCertificateDocumentId,
    };
  }

  async updateCompanyInformation(
    createCompanyInformationDto: CreateCompanyInformationRequestDto,
    userId: string,
    applicationId: string,
    companyInformationId: string,
    ntcCertificateFile?: any
  ) {
    // First, validate the record exists and user has access (outside transaction for early validation)
    const existingApplication = await this.warehouseOperatorRepository.findOne({
      where: { userId, id: applicationId },
    });

    if (!existingApplication) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(existingApplication.status)) {
      throw new BadRequestException('Cannot update company information after application is approved or submitted');
    }

    // Find existing company information
    const existingCompanyInfo = await this.companyInformationRepository.findOne({
      where: { id: companyInformationId, applicationId: existingApplication.id },
      relations: ['ntcCertificate'],
    });

    if (!existingCompanyInfo) {
      throw new NotFoundException('Company information not found');
    }

    // Use transaction to ensure atomicity: history save and update must both succeed or both fail
    const result = await this.dataSource.transaction(async (manager) => {
      const companyInfoRepo = manager.getRepository(CompanyInformation);
      const historyRepo = manager.getRepository(CompanyInformationHistory);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);

      // Reload within transaction to ensure we have the latest data
      const application = await appRepo.findOne({
        where: { id: applicationId, userId },
      });

      if (!application) {
        throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
      }

      // Re-validate application status inside transaction to prevent race conditions
      if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(application.status)) {
        throw new BadRequestException('Cannot update company information after application is approved or submitted');
      }

      const companyInfo = await companyInfoRepo.findOne({
        where: { id: companyInformationId, applicationId: application.id },
        relations: ['ntcCertificate'],
      });

      if (!companyInfo) {
        throw new NotFoundException('Company information not found');
      }

      // Save history of company information if application is rejected (before overwriting)
      if (application.status === WarehouseOperatorApplicationStatus.REJECTED) {
        const historyRecord = historyRepo.create({
          applicationId: companyInfo.applicationId,
          companyInformationId: companyInfo.id,
          companyName: companyInfo.companyName,
          secpRegistrationNumber: companyInfo.secpRegistrationNumber,
          activeFilerStatus: companyInfo.activeFilerStatus,
          dateOfIncorporation: companyInfo.dateOfIncorporation,
          businessCommencementDate: companyInfo.businessCommencementDate,
          registeredOfficeAddress: companyInfo.registeredOfficeAddress,
          postalCode: companyInfo.postalCode,
          nationalTaxNumber: companyInfo.nationalTaxNumber,
          salesTaxRegistrationNumber: companyInfo.salesTaxRegistrationNumber,
          isActive: false,
        });

        // Preserve the original createdAt timestamp from the company information record
        historyRecord.createdAt = companyInfo.createdAt;

        await historyRepo.save(historyRecord);
      }

      // Overwrite existing company information with new information
      companyInfo.companyName = createCompanyInformationDto.companyName;
      companyInfo.secpRegistrationNumber = createCompanyInformationDto.secpRegistrationNumber;
      companyInfo.activeFilerStatus = createCompanyInformationDto.activeFilerStatus;
      companyInfo.dateOfIncorporation = createCompanyInformationDto.dateOfIncorporation;
      companyInfo.businessCommencementDate = createCompanyInformationDto.businessCommencementDate ?? (null as any);
      companyInfo.registeredOfficeAddress = createCompanyInformationDto.registeredOfficeAddress;
      companyInfo.postalCode = createCompanyInformationDto.postalCode ?? (null as any);
      companyInfo.nationalTaxNumber = createCompanyInformationDto.nationalTaxNumber;
      companyInfo.salesTaxRegistrationNumber = createCompanyInformationDto.salesTaxRegistrationNumber;

      const savedCompanyInformation = await companyInfoRepo.save(companyInfo);

      return {
        companyInfo: savedCompanyInformation,
        applicationId: application.applicationId,
        existingNtcCertificate: companyInfo.ntcCertificate,
      };
    });

    // Handle file upload outside transaction (file operations are not transactional)
    let ntcCertificateDocumentId: string | undefined;
    if (ntcCertificateFile) {
      const documentResult = await this.uploadWarehouseDocument(
        ntcCertificateFile,
        userId,
        'CompanyInformation',
        result.companyInfo.id,
        'ntcCertificate'
      );
      ntcCertificateDocumentId = documentResult.id;

      // Update company information with the ntcCertificate foreign key
      const ntcCertificateDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: ntcCertificateDocumentId }
      });

      if (ntcCertificateDocument) {
        result.companyInfo.ntcCertificate = ntcCertificateDocument;
        await this.companyInformationRepository.save(result.companyInfo);
      }
    } else if (result.existingNtcCertificate) {
      // Keep existing certificate if no new file is provided
      ntcCertificateDocumentId = result.existingNtcCertificate.id;
    }

    // if application is rejected, track resubmission and update status if all sections are complete
    if (existingApplication.status === WarehouseOperatorApplicationStatus.REJECTED) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for company information if it exists
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationId: applicationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '2-company-information',
            resourceId: companyInformationId,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      await this.trackResubmissionAndUpdateStatus(
        applicationId,
        '2-company-information',
        companyInformationId,
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: 'Company information updated successfully',
      companyInformationId: result.companyInfo.id,
      applicationId: result.applicationId,
      ntcCertificate: ntcCertificateDocumentId,
    };
  }

  async upsertHrInformation(
    applicationId: string,
    dto: UpsertHrInformationDto,
    userId: string,
    files?: {
      photograph?: any[];
      academicCertificates?: any[];
      professionalCertificates?: any[];
      trainingCertificates?: any[];
      experienceLetters?: any[];
    },
  ) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    const normalizeDate = (dateValue: string | undefined): Date => {
      if (!dateValue) {
        throw new BadRequestException('Date of birth is required.');
      }
      const parsed = new Date(dateValue);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('Invalid date of birth provided.');
      }
      return parsed;
    };

    // Upload files and get document IDs before processing
    // Use application ID as temporary documentableId, will be updated after entity creation
    const uploadedDocumentIds: {
      photograph?: string;
      academicCertificates: string[];
      professionalCertificates: string[];
      trainingCertificates: string[];
      experienceLetters: string[];
    } = {
      academicCertificates: [],
      professionalCertificates: [],
      trainingCertificates: [],
      experienceLetters: [],
    };

    if (files) {
      // Upload photograph
      if (files.photograph && files.photograph.length > 0) {
        const photoDoc = await this.uploadWarehouseDocument(
          files.photograph[0],
          userId,
          'HrPersonalDetails',
          applicationId, // Temporary ID, will be updated
          'photograph',
        );
        uploadedDocumentIds.photograph = photoDoc.id;
      }

      // Upload academic certificates
      if (files.academicCertificates && files.academicCertificates.length > 0) {
        if (files.academicCertificates.length !== dto.academicQualifications.length) {
          throw new BadRequestException(
            `Number of academic certificate files (${files.academicCertificates.length}) does not match number of academic qualifications (${dto.academicQualifications.length})`,
          );
        }
        for (const file of files.academicCertificates) {
          const doc = await this.uploadWarehouseDocument(
            file,
            userId,
            'HrAcademicQualification',
            applicationId, // Temporary ID, will be updated
            'academicCertificate',
          );
          uploadedDocumentIds.academicCertificates.push(doc.id);
        }
      }

      // Upload professional certificates
      if (files.professionalCertificates && files.professionalCertificates.length > 0) {
        if (files.professionalCertificates.length !== dto.professionalQualifications.length) {
          throw new BadRequestException(
            `Number of professional certificate files (${files.professionalCertificates.length}) does not match number of professional qualifications (${dto.professionalQualifications.length})`,
          );
        }
        for (const file of files.professionalCertificates) {
          const doc = await this.uploadWarehouseDocument(
            file,
            userId,
            'HrProfessionalQualification',
            applicationId, // Temporary ID, will be updated
            'professionalCertificate',
          );
          uploadedDocumentIds.professionalCertificates.push(doc.id);
        }
      }

      // Upload training certificates
      if (files.trainingCertificates && files.trainingCertificates.length > 0) {
        if (files.trainingCertificates.length !== dto.trainings.length) {
          throw new BadRequestException(
            `Number of training certificate files (${files.trainingCertificates.length}) does not match number of trainings (${dto.trainings.length})`,
          );
        }
        for (const file of files.trainingCertificates) {
          const doc = await this.uploadWarehouseDocument(
            file,
            userId,
            'HrTraining',
            applicationId, // Temporary ID, will be updated
            'trainingCertificate',
          );
          uploadedDocumentIds.trainingCertificates.push(doc.id);
        }
      }

      // Upload experience letters
      if (files.experienceLetters && files.experienceLetters.length > 0) {
        if (files.experienceLetters.length !== dto.experiences.length) {
          throw new BadRequestException(
            `Number of experience letter files (${files.experienceLetters.length}) does not match number of experiences (${dto.experiences.length})`,
          );
        }
        for (const file of files.experienceLetters) {
          const doc = await this.uploadWarehouseDocument(
            file,
            userId,
            'HrExperience',
            applicationId, // Temporary ID, will be updated
            'experienceLetter',
          );
          uploadedDocumentIds.experienceLetters.push(doc.id);
        }
      }
    }

    // Map uploaded document IDs to DTO (override any existing document IDs from DTO if files were uploaded)
    if (uploadedDocumentIds.photograph) {
      dto.personalDetails.photograph = uploadedDocumentIds.photograph;
    }
    if (uploadedDocumentIds.academicCertificates.length > 0) {
      dto.academicQualifications.forEach((item, idx) => {
        if (uploadedDocumentIds.academicCertificates[idx]) {
          item.academicCertificate = uploadedDocumentIds.academicCertificates[idx];
        }
      });
    }
    if (uploadedDocumentIds.professionalCertificates.length > 0) {
      dto.professionalQualifications.forEach((item, idx) => {
        if (uploadedDocumentIds.professionalCertificates[idx]) {
          item.professionalCertificate = uploadedDocumentIds.professionalCertificates[idx];
        }
      });
    }
    if (uploadedDocumentIds.trainingCertificates.length > 0) {
      dto.trainings.forEach((item, idx) => {
        if (uploadedDocumentIds.trainingCertificates[idx]) {
          item.trainingCertificate = uploadedDocumentIds.trainingCertificates[idx];
        }
      });
    }
    if (uploadedDocumentIds.experienceLetters.length > 0) {
      dto.experiences.forEach((item, idx) => {
        if (uploadedDocumentIds.experienceLetters[idx]) {
          item.experienceLetter = uploadedDocumentIds.experienceLetters[idx];
        }
      });
    }

    const savedHr = await this.dataSource.transaction(async (manager) => {
      const hrRepo = manager.getRepository(HrEntity);
      const personalRepo = manager.getRepository(PersonalDetailsEntity);
      const academicRepo = manager.getRepository(AcademicQualificationsEntity);
      const professionalRepo = manager.getRepository(ProfessionalQualificationsEntity);
      const trainingsRepo = manager.getRepository(TrainingsEntity);
      const experienceRepo = manager.getRepository(ExperienceEntity);
      const declarationRepo = manager.getRepository(DeclarationEntity);
      const designationRepo = manager.getRepository(Designation);
      const documentRepo = manager.getRepository(WarehouseDocument);

      const assignDocument = async (
        documentId: string | undefined | null,
        documentableType: string,
        documentType: string,
        documentableId: string,
      ) => {
        if (!documentId) {
          return;
        }

        const document = await documentRepo.findOne({ where: { id: documentId } });
        if (!document) {
          throw new NotFoundException('Document not found');
        }

        if (document.userId !== userId) {
          throw new BadRequestException('You are not allowed to use this document reference');
        }

        document.documentableType = documentableType;
        document.documentableId = documentableId;
        document.documentType = documentType;
        await documentRepo.save(document);
      };

      const resolveDesignationId = async (input?: string | null): Promise<string | null> => {
        if (!input) {
          return null;
        }

        if (uuidValidate(input)) {
          const designation = await designationRepo.findOne({ where: { id: input } });
          if (designation) {
            return designation.id;
          }
        }

        const trimmed = input.trim().toLowerCase();
        if (!trimmed) {
          return null;
        }

        const designation = await designationRepo
          .createQueryBuilder('designation')
          .where('LOWER(designation.slug) = :value', { value: trimmed })
          .orWhere('LOWER(designation.name) = :value', { value: trimmed })
          .getOne();

        return designation?.id ?? null;
      };

      const resolvedDesignationId =
        (await resolveDesignationId(dto.personalDetails.designationId)) ??
        (await resolveDesignationId(dto.personalDetails.designationName)) ??
        null;

      if (dto.id) {
        const existingHr = await hrRepo.findOne({
          where: { id: dto.id, applicationId: application.id },
          relations: [
            'personalDetails',
            'academicQualifications',
            'professionalQualifications',
            'trainings',
            'experiences',
            'declaration',
            'personalDetails.designation',
          ],
        });

        if (!existingHr) {
          throw new NotFoundException('HR profile not found for this application.');
        }

        Object.assign(existingHr.personalDetails, {
          ...dto.personalDetails,
          designationId: resolvedDesignationId ?? existingHr.personalDetails.designationId ?? undefined,
          dateOfBirth: normalizeDate(dto.personalDetails.dateOfBirth),
          photograph: dto.personalDetails.photograph ?? existingHr.personalDetails.photograph ?? undefined,
        });
        await personalRepo.save(existingHr.personalDetails);

        await assignDocument(
          existingHr.personalDetails.photograph ?? dto.personalDetails.photograph ?? null,
          'HrPersonalDetails',
          'photograph',
          existingHr.personalDetails.id,
        );

        await academicRepo.delete({ hrId: existingHr.id });
        await professionalRepo.delete({ hrId: existingHr.id });
        await trainingsRepo.delete({ hrId: existingHr.id });
        await experienceRepo.delete({ hrId: existingHr.id });

        const academicEntities = await academicRepo.save(
          dto.academicQualifications.map((item) =>
            academicRepo.create({
              ...item,
              academicCertificate: item.academicCertificate ?? null,
              hrId: existingHr.id,
            }),
          ),
        );

        await Promise.all(
          academicEntities.map((entity, idx) =>
            assignDocument(
              dto.academicQualifications[idx]?.academicCertificate ?? null,
              'HrAcademicQualification',
              'academicCertificate',
              entity.id,
            ),
          ),
        );

        const professionalEntities = await professionalRepo.save(
          dto.professionalQualifications.map((item) =>
            professionalRepo.create({
              ...item,
              professionalCertificate: item.professionalCertificate ?? null,
              hrId: existingHr.id,
            }),
          ),
        );

        await Promise.all(
          professionalEntities.map((entity, idx) =>
            assignDocument(
              dto.professionalQualifications[idx]?.professionalCertificate ?? null,
              'HrProfessionalQualification',
              'professionalCertificate',
              entity.id,
            ),
          ),
        );

        const trainingEntities = await trainingsRepo.save(
          dto.trainings.map((item) =>
            trainingsRepo.create({
              ...item,
              trainingCertificate: item.trainingCertificate ?? null,
              hrId: existingHr.id,
            }),
          ),
        );

        await Promise.all(
          trainingEntities.map((entity, idx) =>
            assignDocument(
              dto.trainings[idx]?.trainingCertificate ?? null,
              'HrTraining',
              'trainingCertificate',
              entity.id,
            ),
          ),
        );

        const experienceEntities = await experienceRepo.save(
          dto.experiences.map((item) =>
            experienceRepo.create({
              ...item,
              experienceLetter: item.experienceLetter ?? null,
              hrId: existingHr.id,
            }),
          ),
        );

        await Promise.all(
          experienceEntities.map((entity, idx) =>
            assignDocument(
              dto.experiences[idx]?.experienceLetter ?? null,
              'HrExperience',
              'experienceLetter',
              entity.id,
            ),
          ),
        );

        if (existingHr.declaration) {
          Object.assign(existingHr.declaration, dto.declaration);
          await declarationRepo.save(existingHr.declaration);
        } else {
          const newDeclaration = await declarationRepo.save(declarationRepo.create(dto.declaration));
          existingHr.declaration = newDeclaration;
          existingHr.declarationId = newDeclaration.id;
        }

        existingHr.academicQualifications = academicEntities;
        existingHr.professionalQualifications = professionalEntities;
        existingHr.trainings = trainingEntities;
        existingHr.experiences = experienceEntities;

        await hrRepo.save(existingHr);
        return existingHr;
      }

      const personalDetails = personalRepo.create({
        ...dto.personalDetails,
        designationId: resolvedDesignationId ?? undefined,
        dateOfBirth: normalizeDate(dto.personalDetails.dateOfBirth),
        photograph: dto.personalDetails.photograph ?? undefined,
      });
      await personalRepo.save(personalDetails);

      await assignDocument(
        dto.personalDetails.photograph ?? null,
        'HrPersonalDetails',
        'photograph',
        personalDetails.id,
      );

      const declaration = declarationRepo.create(dto.declaration);
      await declarationRepo.save(declaration);

      const hr = hrRepo.create({
        applicationId: application.id,
        personalDetailsId: personalDetails.id,
        personalDetails,
        declarationId: declaration.id,
        declaration,
      });
      await hrRepo.save(hr);

      const academicEntities = await academicRepo.save(
        dto.academicQualifications.map((item) =>
          academicRepo.create({
            ...item,
            academicCertificate: item.academicCertificate ?? null,
            hrId: hr.id,
          }),
        ),
      );

      await Promise.all(
        academicEntities.map((entity, idx) =>
          assignDocument(
            dto.academicQualifications[idx]?.academicCertificate ?? null,
            'HrAcademicQualification',
            'academicCertificate',
            entity.id,
          ),
        ),
      );

      const professionalEntities = await professionalRepo.save(
        dto.professionalQualifications.map((item) =>
          professionalRepo.create({
            ...item,
            professionalCertificate: item.professionalCertificate ?? null,
            hrId: hr.id,
          }),
        ),
      );

      await Promise.all(
        professionalEntities.map((entity, idx) =>
          assignDocument(
            dto.professionalQualifications[idx]?.professionalCertificate ?? null,
            'HrProfessionalQualification',
            'professionalCertificate',
            entity.id,
          ),
        ),
      );

      const trainingEntities = await trainingsRepo.save(
        dto.trainings.map((item) =>
          trainingsRepo.create({
            ...item,
            trainingCertificate: item.trainingCertificate ?? null,
            hrId: hr.id,
          }),
        ),
      );

      await Promise.all(
        trainingEntities.map((entity, idx) =>
          assignDocument(
            dto.trainings[idx]?.trainingCertificate ?? null,
            'HrTraining',
            'trainingCertificate',
            entity.id,
          ),
        ),
      );

      const experienceEntities = await experienceRepo.save(
        dto.experiences.map((item) =>
          experienceRepo.create({
            ...item,
            experienceLetter: item.experienceLetter ?? null,
            hrId: hr.id,
          }),
        ),
      );

      await Promise.all(
        experienceEntities.map((entity, idx) =>
          assignDocument(
            dto.experiences[idx]?.experienceLetter ?? null,
            'HrExperience',
            'experienceLetter',
            entity.id,
          ),
        ),
      );

      hr.academicQualifications = academicEntities;
      hr.professionalQualifications = professionalEntities;
      hr.trainings = trainingEntities;
      hr.experiences = experienceEntities;

      return hr;
    });

    const hydratedHr = await this.hrRepository.findOne({
      where: { id: savedHr.id },
      relations: [
        'personalDetails',
        'personalDetails.designation',
        'personalDetails.photographDocument',
        'academicQualifications',
        'academicQualifications.academicCertificateDocument',
        'professionalQualifications',
        'professionalQualifications.professionalCertificateDocument',
        'trainings',
        'trainings.trainingCertificateDocument',
        'experiences',
        'experiences.experienceLetterDocument',
        'declaration',
      ],
    });

    return {
      message: 'HR information saved successfully',
      data: this.mapHrEntityToResponse(hydratedHr!),
    };
  }

  /**
   * Get HR information for an application
   */
  async getHrInformation(applicationId: string, userId: string) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found');
    }

    // Find all HR information for this application
    const hrEntities = await this.hrRepository.find({
      where: { applicationId: application.id },
      relations: [
        'personalDetails',
        'personalDetails.designation',
        'personalDetails.photographDocument',
        'academicQualifications',
        'academicQualifications.academicCertificateDocument',
        'professionalQualifications',
        'professionalQualifications.professionalCertificateDocument',
        'trainings',
        'trainings.trainingCertificateDocument',
        'experiences',
        'experiences.experienceLetterDocument',
        'declaration',
      ],
    });

    if (!hrEntities || hrEntities.length === 0) {
      return {
        message: 'HR information not found',
        data: null,
      };
    }

    return {
      message: 'HR information retrieved successfully',
      data: hrEntities.map(hr => this.mapHrEntityToResponse(hr)),
    };
  }

  /**
   * Delete HR information
   */
  async deleteHrInformation(applicationId: string, hrInformationId: string, userId: string) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found');
    }

    // Load HR entity with all relations to ensure cascade deletion works properly
    const hr = await this.hrRepository.findOne({
      where: { id: hrInformationId, applicationId: application.id },
      relations: [
        'personalDetails',
        'academicQualifications',
        'professionalQualifications',
        'trainings',
        'experiences',
        'declaration',
      ],
    });

    if (!hr) {
      throw new NotFoundException('HR information not found');
    }

    // Use remove() which will cascade delete all related entities
    // The cascade: true in the entity definition ensures all children are deleted
    await this.hrRepository.remove(hr);

    return {
      message: 'HR information deleted successfully',
      success: true,
    };
  }

  async getFirstAuthorizedSignatoryName(userId: string) {
    // Find the warehouse operator application for the user
    const application = await this.warehouseOperatorRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' }, // Get the most recent application
    });

    if (!application) {
      return {
        message: 'No warehouse operator application found',
        data: {
          authorizedSignatoryName: null,
          applicantLegalStatus: null,
        },
      };
    }

    // Find the first authorized signatory for this application
    const firstAuthorizedSignatory = await this.authorizedSignatoryRepository.findOne({
      where: {
        warehouseOperatorApplicationRequestId: application.id,
        isActive: true,
      },
      order: { createdAt: 'ASC' }, // Get the first one created
    });

    // Get legal status from registration application (same as registration API)
    let applicantLegalStatus: string | null = null;

    try {
      // Step 1: Find registration_application by userId through user relation
      // Using QueryBuilder since userId is the actual column name (from JoinColumn)
      const registrationApplication = await this.registrationApplicationRepository
        .createQueryBuilder('application')
        .leftJoinAndSelect('application.applicationTypeId', 'applicationTypeId')
        .leftJoinAndSelect('application.user', 'user')
        .where('application.userId = :userId', { userId })
        .getOne();

      if (!registrationApplication) {
        return {
          message: 'First authorized signatory name and applicant legal status retrieved successfully',
          data: {
            authorizedSignatoryName: firstAuthorizedSignatory?.authorizedSignatoryName || null,
            applicantLegalStatus: null,
          },
        };
      }

      // Step 2: Get formId from registration_application
      const formId = registrationApplication.formId;
      if (!formId) {
        return {
          message: 'First authorized signatory name and applicant legal status retrieved successfully',
          data: {
            authorizedSignatoryName: firstAuthorizedSignatory?.authorizedSignatoryName || null,
            applicantLegalStatus: null,
          },
        };
      }

      // Step 3: Find form_fields with specific labels and get their field keys
      // Mapping from labels to readable property names
      const labelToPropertyMap: Record<string, string> = {
        "Please select your application types:": "applicationType",
        "Please select your application type:": "applicationType",
      };

      const targetLabels = Object.keys(labelToPropertyMap);

      // Get all form_fields for this formId
      const allFormFields = await this.formFieldRepository.find({
        where: { formId: formId },
      });

      // Create a map from fieldKey to property name
      const fieldKeyToPropertyMap: Record<string, string> = {};
      for (const label of targetLabels) {
        const field = allFormFields.find(f => f.label === label);
        if (field) {
          fieldKeyToPropertyMap[field.fieldKey] = labelToPropertyMap[label];
        }
      }

      // Step 4: Find registration_application_details using those field keys and applicationId
      const applicationId = registrationApplication.id;
      let applicationTypeFromFormField: string | null = null;

      const fieldKeys = Object.keys(fieldKeyToPropertyMap);
      if (fieldKeys.length > 0) {
        // Get details for this application with the specific field keys
        const applicationDetails = await this.registrationApplicationDetailsRepository.find({
          where: {
            application: { id: applicationId },
            key: In(fieldKeys),
          },
        });

        // Build the details object with readable property names
        for (const detail of applicationDetails) {
          const propertyName = fieldKeyToPropertyMap[detail.key];
          if (propertyName) {
            // Store applicationType from form field as fallback
            if (propertyName === 'applicationType') {
              applicationTypeFromFormField = detail.value;
              break; // Found it, no need to continue
            }
          }
        }
      }

      // Add applicationType - prefer relation value (name) over form field value (slug)
      // Relation value is authoritative and contains the proper name (e.g., "Private Limited")
      // Form field might contain slug (e.g., "private-limited")
      if (registrationApplication.applicationTypeId?.name) {
        applicantLegalStatus = registrationApplication.applicationTypeId.name;
      } else if (applicationTypeFromFormField) {
        // Fallback to form field value if relation is not available
        // if it contain - remove it and add space
        applicationTypeFromFormField = applicationTypeFromFormField.replace(/-/g, ' ');
        applicantLegalStatus = applicationTypeFromFormField.toUpperCase();
      }
    } catch (error) {
      console.error('Error getting registration application details by userId:', error);
      // Continue with null status if error occurs
    }

    return {
      message: 'First authorized signatory name and applicant legal status retrieved successfully',
      data: {
        authorizedSignatoryName: firstAuthorizedSignatory?.authorizedSignatoryName || null,
        applicantLegalStatus: applicantLegalStatus,
      },
    };
  }

  async getWarehouseApplication(applicationId: string, userId: string) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
      relations: ['authorizedSignatories', 'rejections'],
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found');
    }
    let isUnlocked = false;

    if (application.rejections.length > 0) {
      // check if unlockedSections has any section named "1. Authorize Signatory Information"
      isUnlocked = application.rejections.some((rejection) => rejection.unlockedSections.includes('1. Authorize Signatory Information'));
    }

    return {
      message: 'Warehouse application retrieved successfully',
      data: {
        id: application.id,
        applicationId: application.applicationId,
        applicationType: application.applicationType,
        status: application.status,
        authorizedSignatories: application.authorizedSignatories || [],
        isUnlocked,
      },
    };
  }

  async getCompanyInformation(applicationId: string, userId: string) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
      relations: ['rejections'],
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found');
    }

    const companyInformation = await this.companyInformationRepository.findOne({
      where: { applicationId: application.id },
      relations: ['ntcCertificate'],
    });

    if (!companyInformation) {
      return {
        message: 'Company information not found',
        data: null,
      };
    }

    let isUnlocked = false;
    if (application.rejections.length > 0) {
      // check if unlockedSections has any section named "2. Company Information"
      isUnlocked = application.rejections.some((rejection) => rejection.unlockedSections.includes('2. Company Information'));
    }

    return {
      message: 'Company information retrieved successfully',
      data: {
        id: companyInformation.id,
        companyName: companyInformation.companyName,
        secpRegistrationNumber: companyInformation.secpRegistrationNumber,
        activeFilerStatus: companyInformation.activeFilerStatus,
        dateOfIncorporation: companyInformation.dateOfIncorporation,
        businessCommencementDate: companyInformation.businessCommencementDate,
        registeredOfficeAddress: companyInformation.registeredOfficeAddress,
        postalCode: companyInformation.postalCode,
        nationalTaxNumber: companyInformation.nationalTaxNumber,
        salesTaxRegistrationNumber: companyInformation.salesTaxRegistrationNumber,
        ntcCertificate: companyInformation.ntcCertificate
          ? {
            documentId: companyInformation.ntcCertificate.id,
            originalFileName: companyInformation.ntcCertificate.originalFileName ?? undefined,
          }
          : null,
        isUnlocked,
      },
    };
  }


  async getCompanyInformationById(companyInformationId: string) {
    const companyInformation = await this.companyInformationRepository.findOne({
      where: { id: companyInformationId },
      relations: ['ntcCertificate'],
    });

    if (!companyInformation) {
      throw new NotFoundException('Company information not found');
    }

    return {
      message: 'Company information retrieved successfully',
      data: {
        id: companyInformation.id,
        companyName: companyInformation.companyName,
        secpRegistrationNumber: companyInformation.secpRegistrationNumber,
        activeFilerStatus: companyInformation.activeFilerStatus,
        dateOfIncorporation: companyInformation.dateOfIncorporation,
        businessCommencementDate: companyInformation.businessCommencementDate,
        registeredOfficeAddress: companyInformation.registeredOfficeAddress,
        postalCode: companyInformation.postalCode,
        nationalTaxNumber: companyInformation.nationalTaxNumber,
        salesTaxRegistrationNumber: companyInformation.salesTaxRegistrationNumber,
        ntcCertificate: companyInformation.ntcCertificate
          ? {
            documentId: companyInformation.ntcCertificate.id,
            originalFileName: companyInformation.ntcCertificate.originalFileName ?? undefined,
          }
          : null,
      },
    };
  }

  async getBankDetails(applicationId: string, userId: string) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
      relations: ['rejections'],
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found');
    }

    const bankDetails = await this.bankDetailsRepository.findOne({
      where: { applicationId: application.id },
    });

    if (!bankDetails) {
      return {
        message: 'Bank details not found',
        data: null,
      };
    }
    let isUnlocked = false;
    if (application.rejections.length > 0) {
      // check if unlockedSections has any section named "3. Bank Details"
      isUnlocked = application.rejections.some((rejection) => rejection.unlockedSections.includes('3. Bank Details'));
    }

    return {
      message: 'Bank details retrieved successfully',
      data: {
        id: bankDetails.id,
        name: bankDetails.name,
        accountTitle: bankDetails.accountTitle,
        iban: bankDetails.iban,
        accountType: bankDetails.accountType,
        branchAddress: bankDetails.branchAddress,
        status: bankDetails.status,
        isUnlocked,
      },
    };
  }

  async getFinancialInformation(applicationId: string, userId: string) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found');
    }

    const financialInfo = await this.financialInformationRepository.findOne({
      where: { applicationId: application.id },
      relations: [
        'auditReport',
        'taxReturns',
        'taxReturns.document',
        'bankStatements',
        'bankStatements.document',
        'others',
        'others.document',
      ],
    });

    if (!financialInfo) {
      return {
        message: 'Financial information not found',
        data: null,
      };
    }

    return {
      message: 'Financial information retrieved successfully',
      data: await this.mapFinancialInformationEntityToResponse(financialInfo),
    };
  }

  async getApplicantChecklist(applicationId: string, userId: string) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found');
    }

    const checklist = await this.applicantChecklistRepository.findOne({
      where: { applicationId: application.id },
      relations: [
        'humanResources',
        'humanResources.qcPersonnelDocument',
        'humanResources.warehouseSupervisorDocument',
        'humanResources.dataEntryOperatorDocument',
        'financialSoundness',
        'financialSoundness.auditedFinancialStatementsDocument',
        'financialSoundness.positiveNetWorthDocument',
        'financialSoundness.noLoanDefaultsDocument',
        'financialSoundness.cleanCreditHistoryDocument',
        'financialSoundness.adequateWorkingCapitalDocument',
        'financialSoundness.validInsuranceCoverageDocument',
        'financialSoundness.noFinancialFraudDocument',
        'registrationFee',
        'registrationFee.bankPaymentSlipDocument',
        'declaration',
      ],
    });

    if (!checklist) {
      return {
        message: 'Applicant checklist not found',
        data: null,
      };
    }

    return {
      message: 'Applicant checklist retrieved successfully',
      data: this.mapApplicantChecklistEntityToResponse(checklist),
    };
  }

  /**
   * Create HR context for an application
   * Always creates a new HR entity to support multiple HR entries per application
   */
  async createHrContext(applicationId: string, userId: string) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    // Always create a new HR context (supporting multiple HR entries per application)
    const hr = this.hrRepository.create({
      applicationId: application.id,
    });
    const savedHr = await this.hrRepository.save(hr);

    return {
      message: 'HR context created successfully',
      data: {
        id: savedHr.id,
        applicationId: savedHr.applicationId,
        createdAt: savedHr.createdAt.toISOString(),
        updatedAt: savedHr.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Save or update personal details
   */
  async savePersonalDetails(
    applicationId: string,
    dto: HrPersonalDetailsDto,
    userId: string,
    hrInformationId?: string,
    photographFile?: any,
  ) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(application.status)) {
      throw new BadRequestException('Cannot update personal details after application is approved or submitted');
    }

    // Find or create HR context
    let hr: HrEntity | null = null;

    if (hrInformationId) {
      // If hrInformationId is provided, find that specific HR entity
      hr = await this.hrRepository.findOne({
        where: { id: hrInformationId, applicationId: application.id },
      });

      if (!hr) {
        throw new NotFoundException('HR information not found for the provided ID');
      }
    } else {
      // If not provided, create new HR context (for new entries)
      const contextResult = await this.createHrContext(applicationId, userId);
      hr = await this.hrRepository.findOne({
        where: { id: contextResult.data.id },
      });
    }

    if (!hr) {
      throw new BadRequestException('Failed to create or find HR context');
    }

    const normalizeDate = (dateValue: string | undefined): Date => {
      if (!dateValue) {
        throw new BadRequestException('Date of birth is required.');
      }
      const parsed = new Date(dateValue);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('Invalid date of birth provided.');
      }
      return parsed;
    };

    const savedResult = await this.dataSource.transaction(async (manager) => {
      const hrRepo = manager.getRepository(HrEntity);
      const personalRepo = manager.getRepository(PersonalDetailsEntity);
      const designationRepo = manager.getRepository(Designation);
      const documentRepo = manager.getRepository(WarehouseDocument);
      const historyRepo = manager.getRepository(PersonalDetailsHistoryEntity);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);


      const resolveDesignationId = async (input?: string | null): Promise<string | null> => {
        if (!input) {
          return null;
        }

        if (uuidValidate(input)) {
          const designation = await designationRepo.findOne({ where: { id: input } });
          if (designation) {
            return designation.id;
          }
        }

        const trimmed = input.trim().toLowerCase();
        if (!trimmed) {
          return null;
        }

        const designation = await designationRepo
          .createQueryBuilder('designation')
          .where('LOWER(designation.slug) = :value', { value: trimmed })
          .orWhere('LOWER(designation.name) = :value', { value: trimmed })
          .getOne();

        return designation?.id ?? null;
      };

      const assignDocument = async (
        documentId: string | undefined | null,
        documentableType: string,
        documentType: string,
        documentableId: string,
      ) => {
        if (!documentId) {
          return;
        }

        const document = await documentRepo.findOne({ where: { id: documentId } });
        if (!document) {
          throw new NotFoundException('Document not found');
        }

        if (document.userId !== userId) {
          throw new BadRequestException('You are not allowed to use this document reference');
        }

        document.documentableType = documentableType;
        document.documentableId = documentableId;
        document.documentType = documentType;
        await documentRepo.save(document);
      };

      const resolvedDesignationId =
        (await resolveDesignationId(dto.designationId)) ??
        (await resolveDesignationId(dto.designationName)) ??
        null;

      // Upload photograph if provided
      let photographDocumentId = dto.photograph;
      if (photographFile) {
        const photoDoc = await this.uploadWarehouseDocument(
          photographFile,
          userId,
          'HrPersonalDetails',
          applicationId, // Temporary ID, will be updated
          'photograph',
        );
        photographDocumentId = photoDoc.id;
      }

      const currentHr = await hrRepo.findOne({
        where: { id: hr.id },
        relations: ['personalDetails'],
      });

      if (currentHr?.personalDetails) {
        const appInTransaction = await appRepo.findOne({
          where: { id: applicationId, userId },
        });
        if (!appInTransaction) {
          throw new NotFoundException('Application not found');
        }

        if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(appInTransaction.status)) {
          throw new BadRequestException('Cannot update personal details after application is approved or submitted');
        }

        // save history of personal details if application is rejected
        if (appInTransaction?.status === WarehouseOperatorApplicationStatus.REJECTED) {
          await historyRepo.save(
            historyRepo.create({
              id: undefined,
              personalDetailsId: currentHr.personalDetails.id,
              designationId: currentHr.personalDetails.designationId ?? undefined,
              name: currentHr.personalDetails.name,
              fathersHusbandName: currentHr.personalDetails.fathersHusbandName,
              cnicPassport: currentHr.personalDetails.cnicPassport,
              nationality: currentHr.personalDetails.nationality,
              dateOfBirth: currentHr.personalDetails.dateOfBirth,
              residentialAddress: currentHr.personalDetails.residentialAddress,
              businessAddress: currentHr.personalDetails.businessAddress ?? undefined,
              telephone: currentHr.personalDetails.telephone ?? undefined,
              mobileNumber: currentHr.personalDetails.mobileNumber,
              email: currentHr.personalDetails.email,
              nationalTaxNumber: currentHr.personalDetails.nationalTaxNumber ?? undefined,
              photograph: currentHr.personalDetails.photograph ?? undefined,
              isActive: false,
              createdAt: currentHr.personalDetails.createdAt,
            })
          );
        }

        // Update existing personal details
        Object.assign(currentHr.personalDetails, {
          ...dto,
          designationId: resolvedDesignationId ?? currentHr.personalDetails.designationId ?? undefined,
          dateOfBirth: normalizeDate(dto.dateOfBirth),
          photograph: photographDocumentId ?? currentHr.personalDetails.photograph ?? undefined,
        });
        await personalRepo.save(currentHr.personalDetails);

        await assignDocument(
          photographDocumentId ?? null,
          'HrPersonalDetails',
          'photograph',
          currentHr.personalDetails.id,
        );

        currentHr.personalDetailsId = currentHr.personalDetails.id;
        await hrRepo.save(currentHr);

        return currentHr.personalDetails;
      } else {
        // Create new personal details
        const personalDetails = personalRepo.create({
          ...dto,
          designationId: resolvedDesignationId ?? undefined,
          dateOfBirth: normalizeDate(dto.dateOfBirth),
          photograph: photographDocumentId ?? undefined,
        });
        await personalRepo.save(personalDetails);

        await assignDocument(
          photographDocumentId ?? null,
          'HrPersonalDetails',
          'photograph',
          personalDetails.id,
        );

        currentHr!.personalDetailsId = personalDetails.id;
        await hrRepo.save(currentHr!);

        return personalDetails;
      }
    });

    const hydratedHr = await this.hrRepository.findOne({
      where: { id: hr.id },
      relations: [
        'personalDetails',
        'personalDetails.designation',
        'personalDetails.photographDocument',
      ],
    });

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED && hrInformationId) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for HR information if it exists
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationId: applicationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        // Use the personal details ID to find the specific assignment section
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '4-hr-information',
            resourceId: savedResult.id, // Use personal details ID, not hrInformationId
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      // Use the personal details ID (savedResult.id) to match assignment section resourceId
      await this.trackResubmissionAndUpdateStatus(
        applicationId,
        '4-hr-information',
        savedResult.id, // Use personal details ID, not hrInformationId
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: 'Personal details saved successfully',
      data: {
        id: savedResult.id,
        hrId: hr.id,
        designationId: savedResult.designationId ?? null,
        designationName: hydratedHr?.personalDetails?.designation?.name ?? null,
        name: savedResult.name,
        fathersHusbandName: savedResult.fathersHusbandName,
        cnicPassport: savedResult.cnicPassport,
        nationality: savedResult.nationality,
        dateOfBirth: savedResult.dateOfBirth ? savedResult.dateOfBirth.toISOString().split('T')[0] : null,
        residentialAddress: savedResult.residentialAddress,
        businessAddress: savedResult.businessAddress ?? null,
        telephone: savedResult.telephone ?? null,
        mobileNumber: savedResult.mobileNumber,
        email: savedResult.email,
        nationalTaxNumber: savedResult.nationalTaxNumber ?? null,
        photograph: savedResult.photograph ?? null,
        createdAt: savedResult.createdAt.toISOString(),
        updatedAt: savedResult.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Save or update declaration
   */
  async saveDeclaration(
    applicationId: string,
    dto: HrDeclarationDto,
    userId: string,
    hrInformationId?: string,
  ) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    // HR Information ID is required for declaration
    if (!hrInformationId) {
      throw new BadRequestException('HR Information ID is required. Please save personal details first.');
    }

    // Find HR entity
    const hr = await this.hrRepository.findOne({
      where: { id: hrInformationId, applicationId: application.id },
    });

    if (!hr) {
      throw new NotFoundException('HR information not found for the provided ID');
    }

    if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(application.status)) {
      throw new BadRequestException('Cannot update declaration after application is approved or submitted');
    }

    const savedResult = await this.dataSource.transaction(async (manager) => {
      const hrRepo = manager.getRepository(HrEntity);
      const declarationRepo = manager.getRepository(DeclarationEntity);
      const historyRepo = manager.getRepository(DeclarationHistoryEntity);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);

      const appInTransaction = await appRepo.findOne({
        where: { id: applicationId, userId },
      });
      if (!appInTransaction) {
        throw new NotFoundException('Application not found');
      }

      if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(appInTransaction.status)) {
        throw new BadRequestException('Cannot update declaration after application is approved or submitted');
      }

      const currentHr = await hrRepo.findOne({
        where: { id: hr.id },
        relations: ['declaration'],
      });

      if (currentHr?.declaration) {
        if (appInTransaction?.status === WarehouseOperatorApplicationStatus.REJECTED) {
          const historyRecord = historyRepo.create({
            id: undefined,
            declarationId: currentHr.declaration.id,
            writeOffAvailed: currentHr.declaration.writeOffAvailed,
            defaultOfFinance: currentHr.declaration.defaultOfFinance,
            placementOnECL: currentHr.declaration.placementOnECL,
            convictionPleaBargain: currentHr.declaration.convictionPleaBargain,
            isActive: false,
          });

          // Preserve the original createdAt timestamp from the declaration record
          historyRecord.createdAt = currentHr.declaration.createdAt;

          await historyRepo.save(historyRecord);
        }
        // Update existing declaration
        Object.assign(currentHr.declaration, dto);
        await declarationRepo.save(currentHr.declaration);
        return currentHr.declaration;
      } else {
        // Create new declaration
        const declaration = declarationRepo.create(dto);
        await declarationRepo.save(declaration);

        currentHr!.declarationId = declaration.id;
        await hrRepo.save(currentHr!);

        return declaration;
      }
    });

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED && hrInformationId) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for HR information if it exists
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationId: applicationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        // Use the declaration ID to find the specific assignment section
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '4-hr-information',
            resourceId: savedResult.id, // Use declaration ID, not hrInformationId
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      // Use the declaration ID (savedResult.id) to match assignment section resourceId
      await this.trackResubmissionAndUpdateStatus(
        applicationId,
        '4-hr-information',
        savedResult.id, // Use declaration ID, not hrInformationId
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: 'Declaration saved successfully',
      data: {
        id: savedResult.id,
        writeOffAvailed: savedResult.writeOffAvailed,
        defaultOfFinance: savedResult.defaultOfFinance,
        placementOnECL: savedResult.placementOnECL,
        convictionPleaBargain: savedResult.convictionPleaBargain,
        createdAt: savedResult.createdAt.toISOString(),
        updatedAt: savedResult.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Save or update a single academic qualification
   */
  async saveAcademicQualification(
    applicationId: string,
    dto: HrAcademicQualificationDto,
    userId: string,
    id?: string,
    certificateFile?: any,
    hrInformationId?: string,
  ) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(application.status)) {
      throw new BadRequestException('Cannot update academic qualification after application is approved or submitted');
    }

    // HR Information ID is required for academic qualification
    if (!hrInformationId) {
      throw new BadRequestException('HR Information ID is required. Please save personal details first.');
    }

    // Find HR entity
    const hr = await this.hrRepository.findOne({
      where: { id: hrInformationId, applicationId: application.id },
    });

    if (!hr) {
      throw new NotFoundException('HR information not found for the provided ID');
    }

    const savedResult = await this.dataSource.transaction(async (manager) => {
      const academicRepo = manager.getRepository(AcademicQualificationsEntity);
      const documentRepo = manager.getRepository(WarehouseDocument);
      const historyRepo = manager.getRepository(AcademicQualificationsHistoryEntity);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);

      const appInTransaction = await appRepo.findOne({
        where: { id: applicationId, userId },
      });
      if (!appInTransaction) {
        throw new NotFoundException('Application not found');
      }

      if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(appInTransaction.status)) {
        throw new BadRequestException('Cannot update academic qualification after application is approved or submitted');
      }

      const assignDocument = async (
        documentId: string | undefined | null,
        documentableType: string,
        documentType: string,
        documentableId: string,
      ) => {
        if (!documentId) {
          return;
        }

        const document = await documentRepo.findOne({ where: { id: documentId } });
        if (!document) {
          throw new NotFoundException('Document not found');
        }

        if (document.userId !== userId) {
          throw new BadRequestException('You are not allowed to use this document reference');
        }

        document.documentableType = documentableType;
        document.documentableId = documentableId;
        document.documentType = documentType;
        await documentRepo.save(document);
      };

      // Upload certificate if provided
      let certificateDocumentId = dto.academicCertificate;
      if (certificateFile) {
        const certDoc = await this.uploadWarehouseDocument(
          certificateFile,
          userId,
          'HrAcademicQualification',
          applicationId, // Temporary ID, will be updated
          'academicCertificate',
        );
        certificateDocumentId = certDoc.id;
      }

      if (id) {
        const existing = await academicRepo.findOne({
          where: { id, hrId: hr.id },
        });

        if (!existing) {
          throw new NotFoundException('Academic qualification not found');
        }

        // save history of academic qualification if application is rejected
        if (appInTransaction?.status === WarehouseOperatorApplicationStatus.REJECTED) {
          await historyRepo.save(
            historyRepo.create({
              id: undefined,
              academicQualificationsId: existing.id,
              degree: existing.degree,
              major: existing.major,
              institute: existing.institute,
              country: existing.country,
              yearOfPassing: existing.yearOfPassing,
              grade: existing.grade,
              academicCertificate: existing.academicCertificate,
              hrId: hr.id,
              isActive: false,
              createdAt: existing.createdAt,
            })
          );
        }

        Object.assign(existing, {
          ...dto,
          academicCertificate: certificateDocumentId ?? existing.academicCertificate ?? null,
        });
        await academicRepo.save(existing);

        await assignDocument(
          certificateDocumentId ?? null,
          'HrAcademicQualification',
          'academicCertificate',
          existing.id,
        );

        return existing;
      } else {
        // Create new
        const academic = academicRepo.create({
          ...dto,
          academicCertificate: certificateDocumentId ?? null,
          hrId: hr.id,
        });
        await academicRepo.save(academic);

        await assignDocument(
          certificateDocumentId ?? null,
          'HrAcademicQualification',
          'academicCertificate',
          academic.id,
        );

        return academic;
      }
    });

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED && hrInformationId) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for HR information if it exists
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationId: applicationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        // Use the academic qualification ID to find the specific assignment section
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '4-hr-information',
            resourceId: savedResult.id, // Use academic qualification ID, not hrInformationId
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      // Use the academic qualification ID (savedResult.id) to match assignment section resourceId
      await this.trackResubmissionAndUpdateStatus(
        applicationId,
        '4-hr-information',
        savedResult.id, // Use academic qualification ID, not hrInformationId
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: id ? 'Academic qualification updated successfully' : 'Academic qualification saved successfully',
      data: {
        id: savedResult.id,
        degree: savedResult.degree,
        major: savedResult.major,
        institute: savedResult.institute,
        country: savedResult.country,
        yearOfPassing: savedResult.yearOfPassing,
        grade: savedResult.grade ?? null,
        academicCertificate: savedResult.academicCertificate ?? null,
        createdAt: savedResult.createdAt.toISOString(),
        updatedAt: savedResult.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Delete an academic qualification
   */
  async deleteAcademicQualification(id: string, userId: string) {
    const academic = await this.dataSource.getRepository(AcademicQualificationsEntity).findOne({
      where: { id },
      relations: ['hr'],
    });

    if (!academic) {
      throw new NotFoundException('Academic qualification not found');
    }

    // Verify user owns the application
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: academic.hr.applicationId },
    });

    if (!application || application.userId !== userId) {
      throw new BadRequestException('You are not authorized to delete this academic qualification');
    }

    await this.dataSource.getRepository(AcademicQualificationsEntity).remove(academic);

    return {
      message: 'Academic qualification deleted successfully',
      success: true,
    };
  }

  /**
   * Save or update a single professional qualification
   */
  async saveProfessionalQualification(
    applicationId: string,
    dto: HrProfessionalQualificationDto,
    userId: string,
    id?: string,
    certificateFile?: any,
    hrInformationId?: string,
  ) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    // HR Information ID is required for professional qualification
    if (!hrInformationId) {
      throw new BadRequestException('HR Information ID is required. Please save personal details first.');
    }

    // Find HR entity
    const hr = await this.hrRepository.findOne({
      where: { id: hrInformationId, applicationId: application.id },
    });

    if (!hr) {
      throw new NotFoundException('HR information not found for the provided ID');
    }

    if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(application.status)) {
      throw new BadRequestException('Cannot update professional qualification after application is approved or submitted');
    }

    const savedResult = await this.dataSource.transaction(async (manager) => {
      const professionalRepo = manager.getRepository(ProfessionalQualificationsEntity);
      const documentRepo = manager.getRepository(WarehouseDocument);
      const historyRepo = manager.getRepository(ProfessionalQualificationsHistoryEntity);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);
      const appInTransaction = await appRepo.findOne({
        where: { id: applicationId, userId },
      });
      if (!appInTransaction) {
        throw new NotFoundException('Application not found');
      }

      if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(appInTransaction.status)) {
        throw new BadRequestException('Cannot update professional qualification after application is approved or submitted');
      }

      const assignDocument = async (
        documentId: string | undefined | null,
        documentableType: string,
        documentType: string,
        documentableId: string,
      ) => {
        if (!documentId) {
          return;
        }

        const document = await documentRepo.findOne({ where: { id: documentId } });
        if (!document) {
          throw new NotFoundException('Document not found');
        }

        if (document.userId !== userId) {
          throw new BadRequestException('You are not allowed to use this document reference');
        }

        document.documentableType = documentableType;
        document.documentableId = documentableId;
        document.documentType = documentType;
        await documentRepo.save(document);
      };

      // Upload certificate if provided
      let certificateDocumentId = dto.professionalCertificate;
      if (certificateFile) {
        const certDoc = await this.uploadWarehouseDocument(
          certificateFile,
          userId,
          'HrProfessionalQualification',
          applicationId, // Temporary ID, will be updated
          'professionalCertificate',
        );
        certificateDocumentId = certDoc.id;
      }

      if (id) {
        // Update existing
        const existing = await professionalRepo.findOne({
          where: { id, hrId: hr.id },
        });

        if (!existing) {
          throw new NotFoundException('Professional qualification not found');
        }

        if (appInTransaction?.status === WarehouseOperatorApplicationStatus.REJECTED) {
          const historyRecord = historyRepo.create({
            id: undefined,
            professionalQualificationsId: existing.id,
            certificationTitle: existing.certificationTitle,
            issuingBody: existing.issuingBody,
            country: existing.country,
            dateOfAward: existing.dateOfAward,
            validity: existing.validity ?? null,
            membershipNumber: existing.membershipNumber ?? null,
            professionalCertificate: existing.professionalCertificate ?? null,
            hrId: hr.id,
            isActive: false,
          })

          // Preserve the original createdAt timestamp from the professional qualification record
          historyRecord.createdAt = existing.createdAt;

          await historyRepo.save(historyRecord);
        }
        Object.assign(existing, {
          ...dto,
          professionalCertificate: certificateDocumentId ?? existing.professionalCertificate ?? null,
        });
        await professionalRepo.save(existing);

        await assignDocument(
          certificateDocumentId ?? null,
          'HrProfessionalQualification',
          'professionalCertificate',
          existing.id,
        );

        return existing;
      } else {
        // Create new
        const professional = professionalRepo.create({
          ...dto,
          professionalCertificate: certificateDocumentId ?? null,
          hrId: hr.id,
        });
        await professionalRepo.save(professional);

        await assignDocument(
          certificateDocumentId ?? null,
          'HrProfessionalQualification',
          'professionalCertificate',
          professional.id,
        );

        return professional;
      }
    });

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED && hrInformationId) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for HR information if it exists
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationId: applicationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        // Use the professional qualification ID to find the specific assignment section
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '4-hr-information',
            resourceId: savedResult.id, // Use professional qualification ID, not hrInformationId
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      // Use the professional qualification ID (savedResult.id) to match assignment section resourceId
      await this.trackResubmissionAndUpdateStatus(
        applicationId,
        '4-hr-information',
        savedResult.id, // Use professional qualification ID, not hrInformationId
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: id ? 'Professional qualification updated successfully' : 'Professional qualification saved successfully',
      data: {
        id: savedResult.id,
        certificationTitle: savedResult.certificationTitle,
        issuingBody: savedResult.issuingBody,
        country: savedResult.country,
        dateOfAward: savedResult.dateOfAward,
        validity: savedResult.validity ?? null,
        membershipNumber: savedResult.membershipNumber ?? null,
        professionalCertificate: savedResult.professionalCertificate ?? null,
        createdAt: savedResult.createdAt.toISOString(),
        updatedAt: savedResult.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Delete a professional qualification
   */
  async deleteProfessionalQualification(id: string, userId: string) {
    const professional = await this.dataSource.getRepository(ProfessionalQualificationsEntity).findOne({
      where: { id },
      relations: ['hr'],
    });

    if (!professional) {
      throw new NotFoundException('Professional qualification not found');
    }

    // Verify user owns the application
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: professional.hr.applicationId },
    });

    if (!application || application.userId !== userId) {
      throw new BadRequestException('You are not authorized to delete this professional qualification');
    }

    await this.dataSource.getRepository(ProfessionalQualificationsEntity).remove(professional);

    return {
      message: 'Professional qualification deleted successfully',
      success: true,
    };
  }

  /**
   * Save or update a single training
   */
  async saveTraining(
    applicationId: string,
    dto: HrTrainingDto,
    userId: string,
    id?: string,
    certificateFile?: any,
    hrInformationId?: string,
  ) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    // HR Information ID is required for training
    if (!hrInformationId) {
      throw new BadRequestException('HR Information ID is required. Please save personal details first.');
    }

    // Find HR entity
    const hr = await this.hrRepository.findOne({
      where: { id: hrInformationId, applicationId: application.id },
    });

    if (!hr) {
      throw new NotFoundException('HR information not found for the provided ID');
    }

    if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(application.status)) {
      throw new BadRequestException('Cannot update training after application is approved or submitted');
    }

    const savedResult = await this.dataSource.transaction(async (manager) => {
      const trainingsRepo = manager.getRepository(TrainingsEntity);
      const documentRepo = manager.getRepository(WarehouseDocument);
      const historyRepo = manager.getRepository(TrainingsHistoryEntity);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);
      const appInTransaction = await appRepo.findOne({
        where: { id: applicationId, userId },
      });
      if (!appInTransaction) {
        throw new NotFoundException('Application not found');
      }
      if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(appInTransaction.status)) {
        throw new BadRequestException('Cannot update training after application is approved or submitted');
      }

      const assignDocument = async (
        documentId: string | undefined | null,
        documentableType: string,
        documentType: string,
        documentableId: string,
      ) => {
        if (!documentId) {
          return;
        }

        const document = await documentRepo.findOne({ where: { id: documentId } });
        if (!document) {
          throw new NotFoundException('Document not found');
        }

        if (document.userId !== userId) {
          throw new BadRequestException('You are not allowed to use this document reference');
        }

        document.documentableType = documentableType;
        document.documentableId = documentableId;
        document.documentType = documentType;
        await documentRepo.save(document);
      };

      // Upload certificate if provided
      let certificateDocumentId = dto.trainingCertificate;
      if (certificateFile) {
        const certDoc = await this.uploadWarehouseDocument(
          certificateFile,
          userId,
          'HrTraining',
          applicationId, // Temporary ID, will be updated
          'trainingCertificate',
        );
        certificateDocumentId = certDoc.id;
      }

      if (id) {
        // Update existing
        const existing = await trainingsRepo.findOne({
          where: { id, hrId: hr.id },
        });

        if (!existing) {
          throw new NotFoundException('Training not found');
        }

        if (appInTransaction?.status === WarehouseOperatorApplicationStatus.REJECTED) {
          const historyRecord = historyRepo.create({
            id: undefined,
            trainingsId: existing.id,
            trainingTitle: existing.trainingTitle,
            conductedBy: existing.conductedBy,
            trainingType: existing.trainingType,
            durationStart: existing.durationStart,
            durationEnd: existing.durationEnd,
            dateOfCompletion: existing.dateOfCompletion,
            trainingCertificate: existing.trainingCertificate ?? null,
            hrId: hr.id,
            isActive: false,
          });
          historyRecord.createdAt = existing.createdAt;
          await historyRepo.save(historyRecord);
        }

        Object.assign(existing, {
          ...dto,
          trainingCertificate: certificateDocumentId ?? existing.trainingCertificate ?? null,
        });
        await trainingsRepo.save(existing);

        await assignDocument(
          certificateDocumentId ?? null,
          'HrTraining',
          'trainingCertificate',
          existing.id,
        );

        return existing;
      } else {
        // Create new
        const training = trainingsRepo.create({
          ...dto,
          trainingCertificate: certificateDocumentId ?? null,
          hrId: hr.id,
        });
        await trainingsRepo.save(training);

        await assignDocument(
          certificateDocumentId ?? null,
          'HrTraining',
          'trainingCertificate',
          training.id,
        );

        return training;
      }
    });

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED && hrInformationId) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for HR information if it exists
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationId: applicationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        // Use the training ID to find the specific assignment section
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '4-hr-information',
            resourceId: savedResult.id, // Use training ID, not hrInformationId
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      // Use the training ID (savedResult.id) to match assignment section resourceId
      await this.trackResubmissionAndUpdateStatus(
        applicationId,
        '4-hr-information',
        savedResult.id, // Use training ID, not hrInformationId
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: id ? 'Training updated successfully' : 'Training saved successfully',
      data: {
        id: savedResult.id,
        trainingTitle: savedResult.trainingTitle,
        conductedBy: savedResult.conductedBy,
        trainingType: savedResult.trainingType,
        durationStart: savedResult.durationStart,
        durationEnd: savedResult.durationEnd,
        dateOfCompletion: savedResult.dateOfCompletion,
        trainingCertificate: savedResult.trainingCertificate ?? null,
        createdAt: savedResult.createdAt.toISOString(),
        updatedAt: savedResult.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Delete a training
   */
  async deleteTraining(id: string, userId: string) {
    const training = await this.dataSource.getRepository(TrainingsEntity).findOne({
      where: { id },
      relations: ['hr'],
    });

    if (!training) {
      throw new NotFoundException('Training not found');
    }

    // Verify user owns the application
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: training.hr.applicationId },
    });

    if (!application || application.userId !== userId) {
      throw new BadRequestException('You are not authorized to delete this training');
    }

    await this.dataSource.getRepository(TrainingsEntity).remove(training);

    return {
      message: 'Training deleted successfully',
      success: true,
    };
  }

  /**
   * Save or update a single experience
   */
  async saveExperience(
    applicationId: string,
    dto: HrExperienceDto,
    userId: string,
    id?: string,
    experienceLetterFile?: any,
    hrInformationId?: string,
  ) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    // HR Information ID is required for experience
    if (!hrInformationId) {
      throw new BadRequestException('HR Information ID is required. Please save personal details first.');
    }

    // Find HR entity
    const hr = await this.hrRepository.findOne({
      where: { id: hrInformationId, applicationId: application.id },
    });

    if (!hr) {
      throw new NotFoundException('HR information not found for the provided ID');
    }

    if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(application.status)) {
      throw new BadRequestException('Cannot update experience after application is approved or submitted');
    }

    const savedResult = await this.dataSource.transaction(async (manager) => {
      const experienceRepo = manager.getRepository(ExperienceEntity);
      const documentRepo = manager.getRepository(WarehouseDocument);
      const historyRepo = manager.getRepository(ExperienceHistoryEntity);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);

      const appInTransaction = await appRepo.findOne({
        where: { id: applicationId, userId },
      });
      if (!appInTransaction) {
        throw new NotFoundException('Application not found');
      }

      if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(appInTransaction.status)) {
        throw new BadRequestException('Cannot update experience after application is approved or submitted');
      }

      const assignDocument = async (
        documentId: string | undefined | null,
        documentableType: string,
        documentType: string,
        documentableId: string,
      ) => {
        if (!documentId) {
          return;
        }

        const document = await documentRepo.findOne({ where: { id: documentId } });
        if (!document) {
          throw new NotFoundException('Document not found');
        }

        if (document.userId !== userId) {
          throw new BadRequestException('You are not allowed to use this document reference');
        }

        document.documentableType = documentableType;
        document.documentableId = documentableId;
        document.documentType = documentType;
        await documentRepo.save(document);
      };

      // Upload experience letter if provided
      let letterDocumentId = dto.experienceLetter;
      if (experienceLetterFile) {
        const letterDoc = await this.uploadWarehouseDocument(
          experienceLetterFile,
          userId,
          'HrExperience',
          applicationId, // Temporary ID, will be updated
          'experienceLetter',
        );
        letterDocumentId = letterDoc.id;
      }

      if (id) {
        // Update existing
        const existing = await experienceRepo.findOne({
          where: { id, hrId: hr.id },
        });

        if (!existing) {
          throw new NotFoundException('Experience not found');
        }

        if (appInTransaction?.status === WarehouseOperatorApplicationStatus.REJECTED) {
          const historyRecord = historyRepo.create({
            id: undefined,
            experienceId: existing.id,
            positionHeld: existing.positionHeld,
            organizationName: existing.organizationName,
            organizationAddress: existing.organizationAddress,
            natureOfOrganization: existing.natureOfOrganization,
            dateOfAppointment: existing.dateOfAppointment,
            dateOfLeaving: existing.dateOfLeaving ?? null,
            duration: existing.duration ?? null,
            responsibilities: existing.responsibilities ?? null,
            experienceLetter: existing.experienceLetter ?? null,
            hrId: hr.id,
            isActive: false,
          });

          // Preserve the original createdAt timestamp from the experience record
          historyRecord.createdAt = existing.createdAt;
          await historyRepo.save(historyRecord);
        }

        Object.assign(existing, {
          ...dto,
          experienceLetter: letterDocumentId ?? existing.experienceLetter ?? null,
        });
        await experienceRepo.save(existing);

        await assignDocument(
          letterDocumentId ?? null,
          'HrExperience',
          'experienceLetter',
          existing.id,
        );

        return existing;
      } else {
        // Create new
        const experience = experienceRepo.create({
          ...dto,
          experienceLetter: letterDocumentId ?? null,
          hrId: hr.id,
        });
        await experienceRepo.save(experience);

        await assignDocument(
          letterDocumentId ?? null,
          'HrExperience',
          'experienceLetter',
          experience.id,
        );

        return experience;
      }
    });

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED && hrInformationId) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for HR information if it exists
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationId: applicationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        // Use the experience ID to find the specific assignment section
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '4-hr-information',
            resourceId: savedResult.id, // Use experience ID, not hrInformationId
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      // Use the experience ID (savedResult.id) to match assignment section resourceId
      await this.trackResubmissionAndUpdateStatus(
        applicationId,
        '4-hr-information',
        savedResult.id, // Use experience ID, not hrInformationId
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: id ? 'Experience updated successfully' : 'Experience saved successfully',
      data: {
        id: savedResult.id,
        positionHeld: savedResult.positionHeld,
        organizationName: savedResult.organizationName,
        organizationAddress: savedResult.organizationAddress,
        natureOfOrganization: savedResult.natureOfOrganization,
        dateOfAppointment: savedResult.dateOfAppointment,
        dateOfLeaving: savedResult.dateOfLeaving ?? null,
        duration: savedResult.duration ?? null,
        responsibilities: savedResult.responsibilities ?? null,
        experienceLetter: savedResult.experienceLetter ?? null,
        createdAt: savedResult.createdAt.toISOString(),
        updatedAt: savedResult.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Delete an experience
   */
  async deleteExperience(id: string, userId: string) {
    const experience = await this.dataSource.getRepository(ExperienceEntity).findOne({
      where: { id },
      relations: ['hr'],
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    // Verify user owns the application
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: experience.hr.applicationId },
    });

    if (!application || application.userId !== userId) {
      throw new BadRequestException('You are not authorized to delete this experience');
    }

    await this.dataSource.getRepository(ExperienceEntity).remove(experience);

    return {
      message: 'Experience deleted successfully',
      success: true,
    };
  }

  async createFinancialInformation(
    applicationId: string,
    dto: CreateFinancialInformationDto,
    userId: string,
  ) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(application.status)) {
      throw new BadRequestException('Cannot update financial information after application is approved or submitted');
    }

    // Check if financial information already exists for this application (only when creating new, not updating)
    if (!dto.id) {
      const existingFinancialInfo = await this.financialInformationRepository.findOne({
        where: { applicationId: application.id },
        relations: [
          'auditReport',
          'taxReturns',
          'bankStatements',
          'others',
        ],
      });

      if (existingFinancialInfo) {
        throw new BadRequestException('Financial information already exists for this application. Please update instead of creating a new one.');
      }
    }

    const savedFinancialInfo = await this.dataSource.transaction(async (manager) => {
      const financialInfoRepo = manager.getRepository(FinancialInformationEntity);
      const auditReportRepo = manager.getRepository(AuditReportEntity);
      const taxReturnRepo = manager.getRepository(TaxReturnEntity);
      const bankStatementRepo = manager.getRepository(BankStatementEntity);
      const othersRepo = manager.getRepository(OthersEntity);
      const auditReportHistoryRepo = manager.getRepository(AuditReportHistoryEntity);
      const taxReturnHistoryRepo = manager.getRepository(TaxReturnHistoryEntity);
      const bankStatementHistoryRepo = manager.getRepository(BankStatementHistoryEntity);
      const othersHistoryRepo = manager.getRepository(OthersHistoryEntity);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);

      const appInTransaction = await appRepo.findOne({
        where: { id: applicationId, userId },
      });
      if (!appInTransaction) {
        throw new NotFoundException('Application not found');
      }

      if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(appInTransaction.status)) {
        throw new BadRequestException('Cannot update financial information after application is approved or submitted');
      }

      if (dto.id) {
        const existingFinancialInfo = await financialInfoRepo.findOne({
          where: { id: dto.id, applicationId: application.id },
          relations: [
            'auditReport',
            'taxReturns',
            'bankStatements',
            'others',
          ],
        });

        if (!existingFinancialInfo) {
          throw new NotFoundException('Financial information not found for this application.');
        }

        // Update audit report
        if (existingFinancialInfo.auditReport) {
          if (appInTransaction?.status === WarehouseOperatorApplicationStatus.REJECTED) {
            const historyRecord = auditReportHistoryRepo.create({
              id: undefined,
              auditReportId: existingFinancialInfo.auditReport.id,
              documentType: existingFinancialInfo.auditReport.documentType,
              documentName: existingFinancialInfo.auditReport.documentName,
              periodStart: existingFinancialInfo.auditReport.periodStart,
              periodEnd: existingFinancialInfo.auditReport.periodEnd,
              assets: existingFinancialInfo.auditReport.assets,
              liabilities: existingFinancialInfo.auditReport.liabilities,
              equity: existingFinancialInfo.auditReport.equity,
              revenue: existingFinancialInfo.auditReport.revenue,
              netProfitLoss: existingFinancialInfo.auditReport.netProfitLoss,
              remarks: existingFinancialInfo.auditReport.remarks,
              isActive: false,
            });
            historyRecord.createdAt = existingFinancialInfo.auditReport.createdAt;
            await auditReportHistoryRepo.save(historyRecord);
          }

          Object.assign(existingFinancialInfo.auditReport, dto.auditReport);
          await auditReportRepo.save(existingFinancialInfo.auditReport);
        }

        // copy in relevant history table before deleting
        if (existingFinancialInfo.taxReturns.length > 0) {
          if (appInTransaction?.status === WarehouseOperatorApplicationStatus.REJECTED) {
            for (const taxReturn of existingFinancialInfo.taxReturns) {
              const taxReturnHistoryRecord = taxReturnHistoryRepo.create({
                id: undefined,
                taxReturnId: taxReturn.id,
                documentType: taxReturn.documentType,
                documentName: taxReturn.documentName,
                periodStart: taxReturn.periodStart,
                periodEnd: taxReturn.periodEnd,
                remarks: taxReturn.remarks,
                isActive: false,
              });
              taxReturnHistoryRecord.createdAt = taxReturn.createdAt;
              await taxReturnHistoryRepo.save(taxReturnHistoryRecord);
            }
          }
        }

        if (existingFinancialInfo.bankStatements.length > 0) {
          if (appInTransaction?.status === WarehouseOperatorApplicationStatus.REJECTED) {
            for (const bankStatement of existingFinancialInfo.bankStatements) {
              const bankStatementHistoryRecord = bankStatementHistoryRepo.create({
                id: undefined,
                bankStatementId: bankStatement.id,
                documentType: bankStatement.documentType,
                documentName: bankStatement.documentName,
                periodStart: bankStatement.periodStart,
                periodEnd: bankStatement.periodEnd,
                remarks: bankStatement.remarks,
                isActive: false,
              });
              bankStatementHistoryRecord.createdAt = bankStatement.createdAt;
              await bankStatementHistoryRepo.save(bankStatementHistoryRecord);
            }
          }
        }

        if (existingFinancialInfo.others.length > 0) {
          if (appInTransaction?.status === WarehouseOperatorApplicationStatus.REJECTED) {
            for (const other of existingFinancialInfo.others) {
              const othersHistoryRecord = othersHistoryRepo.create({
                id: undefined,
                othersId: other.id,
                documentType: other.documentType,
                documentName: other.documentName,
                periodStart: other.periodStart,
                periodEnd: other.periodEnd,
                remarks: other.remarks,
                isActive: false,
              });
              othersHistoryRecord.createdAt = other.createdAt;
              await othersHistoryRepo.save(othersHistoryRecord);
            }
          }
        }

        // Delete existing children and create new ones
        await taxReturnRepo.delete({ financialInformationId: existingFinancialInfo.id });
        await bankStatementRepo.delete({ financialInformationId: existingFinancialInfo.id });
        await othersRepo.delete({ financialInformationId: existingFinancialInfo.id });

        // Create new tax return
        const taxReturn = await taxReturnRepo.save(
          taxReturnRepo.create({
            ...dto.taxReturn,
            financialInformationId: existingFinancialInfo.id,
          }),
        );

        // Create new bank statement
        const bankStatement = await bankStatementRepo.save(
          bankStatementRepo.create({
            ...dto.bankStatement,
            financialInformationId: existingFinancialInfo.id,
          }),
        );

        // Create new others
        const others = await othersRepo.save(
          othersRepo.create({
            ...dto.other,
            financialInformationId: existingFinancialInfo.id,
          }),
        );

        existingFinancialInfo.taxReturns = [taxReturn];
        existingFinancialInfo.bankStatements = [bankStatement];
        existingFinancialInfo.others = [others];

        await financialInfoRepo.save(existingFinancialInfo);
        return existingFinancialInfo;
      }

      // Create new financial information
      const auditReport = await auditReportRepo.save(auditReportRepo.create(dto.auditReport));

      const financialInfo = financialInfoRepo.create({
        applicationId: application.id,
        auditReportId: auditReport.id,
        auditReport,
      });
      await financialInfoRepo.save(financialInfo);

      // Create tax return
      const taxReturn = await taxReturnRepo.save(
        taxReturnRepo.create({
          ...dto.taxReturn,
          financialInformationId: financialInfo.id,
        }),
      );

      // Create bank statement
      const bankStatement = await bankStatementRepo.save(
        bankStatementRepo.create({
          ...dto.bankStatement,
          financialInformationId: financialInfo.id,
        }),
      );

      // Create others
      const others = await othersRepo.save(
        othersRepo.create({
          ...dto.other,
          financialInformationId: financialInfo.id,
        }),
      );

      financialInfo.taxReturns = [taxReturn];
      financialInfo.bankStatements = [bankStatement];
      financialInfo.others = [others];

      return financialInfo;
    });

    const hydratedFinancialInfo = await this.financialInformationRepository.findOne({
      where: { id: savedFinancialInfo.id },
      relations: [
        'auditReport',
        'taxReturns',
        'bankStatements',
        'others',
      ],
    });

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for financial information if it exists
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationId: applicationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '5-financial-information',
            resourceId: savedFinancialInfo.id,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      await this.trackResubmissionAndUpdateStatus(
        applicationId,
        '5-financial-information',
        savedFinancialInfo.id,
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: 'Financial information saved successfully',
      data: await this.mapFinancialInformationEntityToResponse(hydratedFinancialInfo!),
    };
  }

  /**
   * Save or update a single other document
   * @deprecated Use FinancialInformationService.saveOther instead
   */
  async saveOther(
    applicationId: string,
    dto: OthersDto,
    userId: string,
    id?: string,
    documentFile?: any,
  ) {
    return this.financialInformationService.saveOther(applicationId, dto, userId, id, documentFile);
  }

  /**
   * Delete an other document
   * @deprecated Use FinancialInformationService.deleteOther instead
   */
  async deleteOther(id: string, userId: string) {
    return this.financialInformationService.deleteOther(id, userId);
  }

  /**
   * Unified method to save or update a financial subsection
   * @deprecated Use FinancialInformationService.saveFinancialSubsection instead
   */
  async saveFinancialSubsection(
    sectionType: 'audit-report' | 'tax-return' | 'bank-statement' | 'other',
    applicationId: string,
    dto: any,
    userId: string,
    id?: string,
    documentFile?: any,
  ) {
    return this.financialInformationService.saveFinancialSubsection(
      sectionType,
      applicationId,
      dto,
      userId,
      id,
      documentFile,
    );
  }

  /**
   * Unified method to delete a financial subsection
   * @deprecated Use FinancialInformationService.deleteFinancialSubsection instead
   */
  async deleteFinancialSubsection(
    sectionType: 'audit-report' | 'tax-return' | 'bank-statement' | 'other',
    id: string,
    userId: string,
  ) {
    return this.financialInformationService.deleteFinancialSubsection(sectionType, id, userId);
  }

  /**
   * Upload applicant checklist files and return document IDs
   */
  private async uploadApplicantChecklistFiles(
    files: any,
    userId: string,
    applicationId: string,
  ): Promise<Record<string, string>> {
    const uploadedDocumentIds: Record<string, string> = {};
    const fileConfigs = [
      { key: 'qcPersonnelFile', type: 'HumanResourcesChecklist' },
      { key: 'warehouseSupervisorFile', type: 'HumanResourcesChecklist' },
      { key: 'dataEntryOperatorFile', type: 'HumanResourcesChecklist' },
      { key: 'auditedFinancialStatementsFile', type: 'FinancialSoundnessChecklist' },
      { key: 'positiveNetWorthFile', type: 'FinancialSoundnessChecklist' },
      { key: 'noLoanDefaultsFile', type: 'FinancialSoundnessChecklist' },
      { key: 'cleanCreditHistoryFile', type: 'FinancialSoundnessChecklist' },
      { key: 'adequateWorkingCapitalFile', type: 'FinancialSoundnessChecklist' },
      { key: 'validInsuranceCoverageFile', type: 'FinancialSoundnessChecklist' },
      { key: 'noFinancialFraudFile', type: 'FinancialSoundnessChecklist' },
      { key: 'bankPaymentSlip', type: 'RegistrationFeeChecklist' },
    ];

    for (const config of fileConfigs) {
      const fileArray = files?.[config.key];
      if (fileArray && fileArray.length > 0) {
        const doc = await this.uploadWarehouseDocument(
          fileArray[0],
          userId,
          config.type,
          applicationId,
          config.key,
        );
        uploadedDocumentIds[config.key] = doc.id;
      }
    }

    return uploadedDocumentIds;
  }

  /**
   * Map uploaded document IDs to DTO
   */
  private mapUploadedDocumentsToDto(
    dto: CreateApplicantChecklistDto,
    uploadedDocumentIds: Record<string, string>,
  ): void {
    if (uploadedDocumentIds.qcPersonnelFile) {
      dto.humanResources.qcPersonnelFile = uploadedDocumentIds.qcPersonnelFile;
    }
    if (uploadedDocumentIds.warehouseSupervisorFile) {
      dto.humanResources.warehouseSupervisorFile = uploadedDocumentIds.warehouseSupervisorFile;
    }
    if (uploadedDocumentIds.dataEntryOperatorFile) {
      dto.humanResources.dataEntryOperatorFile = uploadedDocumentIds.dataEntryOperatorFile;
    }
    if (uploadedDocumentIds.auditedFinancialStatementsFile) {
      dto.financialSoundness.auditedFinancialStatementsFile = uploadedDocumentIds.auditedFinancialStatementsFile;
    }
    if (uploadedDocumentIds.positiveNetWorthFile) {
      dto.financialSoundness.positiveNetWorthFile = uploadedDocumentIds.positiveNetWorthFile;
    }
    if (uploadedDocumentIds.noLoanDefaultsFile) {
      dto.financialSoundness.noLoanDefaultsFile = uploadedDocumentIds.noLoanDefaultsFile;
    }
    if (uploadedDocumentIds.cleanCreditHistoryFile) {
      dto.financialSoundness.cleanCreditHistoryFile = uploadedDocumentIds.cleanCreditHistoryFile;
    }
    if (uploadedDocumentIds.adequateWorkingCapitalFile) {
      dto.financialSoundness.adequateWorkingCapitalFile = uploadedDocumentIds.adequateWorkingCapitalFile;
    }
    if (uploadedDocumentIds.validInsuranceCoverageFile) {
      dto.financialSoundness.validInsuranceCoverageFile = uploadedDocumentIds.validInsuranceCoverageFile;
    }
    if (uploadedDocumentIds.noFinancialFraudFile) {
      dto.financialSoundness.noFinancialFraudFile = uploadedDocumentIds.noFinancialFraudFile;
    }
    if (uploadedDocumentIds.bankPaymentSlip) {
      dto.registrationFee.bankPaymentSlip = uploadedDocumentIds.bankPaymentSlip;
    }
  }

  /**
   * Validate that files are provided when corresponding booleans are true
   */
  private validateApplicantChecklistFiles(dto: CreateApplicantChecklistDto): void {
    const validations = [
      { condition: dto.humanResources.qcPersonnel, file: dto.humanResources.qcPersonnelFile, field: 'qcPersonnelFile' },
      {
        condition: dto.humanResources.warehouseSupervisor,
        file: dto.humanResources.warehouseSupervisorFile,
        field: 'warehouseSupervisorFile',
      },
      {
        condition: dto.humanResources.dataEntryOperator,
        file: dto.humanResources.dataEntryOperatorFile,
        field: 'dataEntryOperatorFile',
      },
      {
        condition: dto.financialSoundness.auditedFinancialStatements,
        file: dto.financialSoundness.auditedFinancialStatementsFile,
        field: 'auditedFinancialStatementsFile',
      },
      {
        condition: dto.financialSoundness.positiveNetWorth,
        file: dto.financialSoundness.positiveNetWorthFile,
        field: 'positiveNetWorthFile',
      },
      {
        condition: dto.financialSoundness.noLoanDefaults,
        file: dto.financialSoundness.noLoanDefaultsFile,
        field: 'noLoanDefaultsFile',
      },
      {
        condition: dto.financialSoundness.cleanCreditHistory,
        file: dto.financialSoundness.cleanCreditHistoryFile,
        field: 'cleanCreditHistoryFile',
      },
      {
        condition: dto.financialSoundness.adequateWorkingCapital,
        file: dto.financialSoundness.adequateWorkingCapitalFile,
        field: 'adequateWorkingCapitalFile',
      },
      {
        condition: dto.financialSoundness.validInsuranceCoverage,
        file: dto.financialSoundness.validInsuranceCoverageFile,
        field: 'validInsuranceCoverageFile',
      },
      {
        condition: dto.financialSoundness.noFinancialFraud,
        file: dto.financialSoundness.noFinancialFraudFile,
        field: 'noFinancialFraudFile',
      },
    ];

    for (const validation of validations) {
      if (validation.condition && !validation.file) {
        throw new BadRequestException(`${validation.field} is required when the corresponding boolean is true`);
      }
    }

    if (!dto.registrationFee.bankPaymentSlip) {
      throw new BadRequestException('bankPaymentSlip is required');
    }
  }

  async createApplicantChecklist(
    applicationId: string,
    dto: CreateApplicantChecklistDto,
    userId: string,
    files?: {
      qcPersonnelFile?: any[];
      warehouseSupervisorFile?: any[];
      dataEntryOperatorFile?: any[];
      auditedFinancialStatementsFile?: any[];
      positiveNetWorthFile?: any[];
      noLoanDefaultsFile?: any[];
      cleanCreditHistoryFile?: any[];
      adequateWorkingCapitalFile?: any[];
      validInsuranceCoverageFile?: any[];
      noFinancialFraudFile?: any[];
      bankPaymentSlip?: any[];
    },
    submit: boolean = false,
  ) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    // only allow when status is DRAFT
    if (application.status !== WarehouseOperatorApplicationStatus.DRAFT && application.status !== WarehouseOperatorApplicationStatus.RESUBMITTED && application.status !== WarehouseOperatorApplicationStatus.REJECTED) {
      throw new BadRequestException('Applicant checklist can only be added while application is in draft status.');
    }

    // Check if applicant checklist already exists for this application (only when creating new, not updating)
    if (!dto.id) {
      const existingApplicantChecklist = await this.applicantChecklistRepository.findOne({
        where: { applicationId: application.id }
      });

      if (existingApplicantChecklist) {
        throw new BadRequestException('Applicant checklist already exists for this application. Please update instead of creating a new one.');
      }
    }

    // Upload files and map to DTO
    const uploadedDocumentIds = files ? await this.uploadApplicantChecklistFiles(files, userId, applicationId) : {};
    this.mapUploadedDocumentsToDto(dto, uploadedDocumentIds);

    // Validate required files
    this.validateApplicantChecklistFiles(dto);

    const savedApplicantChecklist = await this.dataSource.transaction(async (manager) => {
      const repos = {
        applicantChecklist: manager.getRepository(ApplicantChecklistEntity),
        applicantChecklistHistory: manager.getRepository(ApplicantChecklistHistoryEntity),
        humanResources: manager.getRepository(HumanResourcesChecklistEntity),
        financialSoundness: manager.getRepository(FinancialSoundnessChecklistEntity),
        registrationFee: manager.getRepository(RegistrationFeeChecklistEntity),
        declaration: manager.getRepository(DeclarationChecklistEntity),
        document: manager.getRepository(WarehouseDocument),
        application: manager.getRepository(WarehouseOperatorApplicationRequest),
      };

      // Reload within transaction to ensure we have the latest data
      const application = await repos.application.findOne({
        where: { id: applicationId, userId },
      });

      if (!application) {
        throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
      }

      // Re-validate application status inside transaction to prevent race conditions
      if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(application.status)) {
        throw new BadRequestException('Cannot update applicant checklist after application is approved or submitted');
      }

      const assignDocument = this.createAssignDocumentFunction(repos.document, userId);
      const assignDocuments = this.createBatchAssignDocumentsFunction(assignDocument);

      let result;
      if (dto.id) {
        result = await this.updateApplicantChecklist(
          dto,
          application,
          repos,
          assignDocuments,
        );
      } else {
        result = await this.createNewApplicantChecklist(
          dto,
          application,
          repos,
          assignDocuments,
        );
      }

      if (submit) {
        application.status = WarehouseOperatorApplicationStatus.PENDING;
        await repos.application.save(application);
      }

      return result;
    });

    const hydratedApplicantChecklist = await this.applicantChecklistRepository.findOne({
      where: { id: savedApplicantChecklist.id },
      relations: ['humanResources', 'financialSoundness', 'registrationFee', 'declaration'],
    });

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for applicant checklist if it exists
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationId: applicationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '6-application-checklist-questionnaire',
            resourceId: savedApplicantChecklist.id,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      await this.trackResubmissionAndUpdateStatus(
        applicationId,
        '6-application-checklist-questionnaire',
        savedApplicantChecklist.id,
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: 'Applicant checklist saved successfully',
      data: this.mapApplicantChecklistEntityToResponse(hydratedApplicantChecklist!),
    };
  }

  /**
   * Create assign document function for transaction
   * Handles unlinking old documents when new ones are assigned
   */
  private createAssignDocumentFunction(documentRepo: Repository<WarehouseDocument>, userId: string) {
    return async (
      documentId: string | undefined | null,
      documentableType: string,
      documentType: string,
      documentableId: string,
      oldDocumentId?: string | null,
    ) => {
      // Unlink old document if it exists and is different from the new one
      // Mark old document as inactive since fields are non-nullable
      if (oldDocumentId && oldDocumentId !== documentId) {
        const oldDocument = await documentRepo.findOne({ where: { id: oldDocumentId } });
        if (oldDocument && oldDocument.documentableId === documentableId && oldDocument.documentType === documentType) {
          // Mark old document as inactive (effectively unlinking it)
          oldDocument.isActive = false;
          await documentRepo.save(oldDocument);
        }
      }

      // Assign new document if provided
      if (!documentId) return;

      const document = await documentRepo.findOne({ where: { id: documentId } });
      if (!document) {
        throw new NotFoundException('Document not found');
      }

      if (document.userId !== userId) {
        throw new BadRequestException('You are not allowed to use this document reference');
      }

      document.documentableType = documentableType;
      document.documentableId = documentableId;
      document.documentType = documentType;
      await documentRepo.save(document);
    };
  }

  /**
   * Create batch assign documents function
   */
  private createBatchAssignDocumentsFunction(assignDocument: Function) {
    return async (
      documents: Array<{ id: string | undefined | null; type: string; documentType: string; entityId: string; oldId?: string | null }>,
    ) => {
      await Promise.all(
        documents.map((doc) => assignDocument(doc.id, doc.type, doc.documentType, doc.entityId, doc.oldId)),
      );
    };
  }

  /**
   * Update existing applicant checklist
   */
  private async updateApplicantChecklist(
    dto: CreateApplicantChecklistDto,
    application: WarehouseOperatorApplicationRequest,
    repos: any,
    assignDocuments: Function,
  ) {
    const existingApplicantChecklist = await repos.applicantChecklist.findOne({
      where: { id: dto.id, applicationId: application.id },
      relations: ['humanResources', 'financialSoundness', 'registrationFee', 'declaration'],
    });

    if (!existingApplicantChecklist) {
      throw new NotFoundException('Applicant checklist not found for this application.');
    }

    // Save history of applicant checklist if application is rejected (before overwriting)
    if (application.status === WarehouseOperatorApplicationStatus.REJECTED) {
      const applicantChecklistHistory = repos.applicantChecklistHistory.create({
        applicantChecklistId: existingApplicantChecklist.id,
        applicationId: application.id,
        humanResourcesId: existingApplicantChecklist.humanResourcesId,
        financialSoundnessId: existingApplicantChecklist.financialSoundnessId,
        registrationFeeId: existingApplicantChecklist.registrationFeeId,
        declarationId: existingApplicantChecklist.declarationId,
        isActive: false,
      });
      // Preserve the original createdAt timestamp from the applicant checklist record
      applicantChecklistHistory.createdAt = existingApplicantChecklist.createdAt;
      await repos.applicantChecklistHistory.save(applicantChecklistHistory);
    }

    // Update or create Human Resources
    let hrEntity: HumanResourcesChecklistEntity;
    if (existingApplicantChecklist.humanResources) {
      hrEntity = await this.updateHumanResources(existingApplicantChecklist.humanResources, dto.humanResources, repos.humanResources);
    } else {
      hrEntity = await this.createHumanResources(dto.humanResources, existingApplicantChecklist, repos.humanResources);
      existingApplicantChecklist.humanResources = hrEntity;
      existingApplicantChecklist.humanResourcesId = hrEntity.id;
    }

    // Get old document IDs before update for unlinking
    const oldHrDocumentIds = existingApplicantChecklist.humanResources ? {
      qcPersonnelFile: existingApplicantChecklist.humanResources.qcPersonnelFile,
      warehouseSupervisorFile: existingApplicantChecklist.humanResources.warehouseSupervisorFile,
      dataEntryOperatorFile: existingApplicantChecklist.humanResources.dataEntryOperatorFile,
    } : { qcPersonnelFile: null, warehouseSupervisorFile: null, dataEntryOperatorFile: null };

    // Only assign documents when checkbox is true (to preserve files when checkbox is false)
    const hrDocumentsToAssign = [];
    if (dto.humanResources.qcPersonnel) {
      hrDocumentsToAssign.push({
        id: hrEntity.qcPersonnelFile ?? dto.humanResources.qcPersonnelFile ?? null,
        type: 'HumanResourcesChecklist',
        documentType: 'qcPersonnelFile',
        entityId: hrEntity.id,
        oldId: oldHrDocumentIds.qcPersonnelFile,
      });
    }
    if (dto.humanResources.warehouseSupervisor) {
      hrDocumentsToAssign.push({
        id: hrEntity.warehouseSupervisorFile ?? dto.humanResources.warehouseSupervisorFile ?? null,
        type: 'HumanResourcesChecklist',
        documentType: 'warehouseSupervisorFile',
        entityId: hrEntity.id,
        oldId: oldHrDocumentIds.warehouseSupervisorFile,
      });
    }
    if (dto.humanResources.dataEntryOperator) {
      hrDocumentsToAssign.push({
        id: hrEntity.dataEntryOperatorFile ?? dto.humanResources.dataEntryOperatorFile ?? null,
        type: 'HumanResourcesChecklist',
        documentType: 'dataEntryOperatorFile',
        entityId: hrEntity.id,
        oldId: oldHrDocumentIds.dataEntryOperatorFile,
      });
    }
    if (hrDocumentsToAssign.length > 0) {
      await assignDocuments(hrDocumentsToAssign);
    }

    // Update or create Financial Soundness
    const fsEntity = existingApplicantChecklist.financialSoundness
      ? await this.updateFinancialSoundness(
        existingApplicantChecklist.financialSoundness,
        dto.financialSoundness,
        repos.financialSoundness,
      )
      : await this.createFinancialSoundness(dto.financialSoundness, existingApplicantChecklist, repos.financialSoundness);

    if (!existingApplicantChecklist.financialSoundness) {
      existingApplicantChecklist.financialSoundness = fsEntity;
      existingApplicantChecklist.financialSoundnessId = fsEntity.id;
    }

    // Get old document IDs before update for unlinking
    const oldFsDocumentIds = existingApplicantChecklist.financialSoundness ? {
      auditedFinancialStatementsFile: existingApplicantChecklist.financialSoundness.auditedFinancialStatementsFile,
      positiveNetWorthFile: existingApplicantChecklist.financialSoundness.positiveNetWorthFile,
      noLoanDefaultsFile: existingApplicantChecklist.financialSoundness.noLoanDefaultsFile,
      cleanCreditHistoryFile: existingApplicantChecklist.financialSoundness.cleanCreditHistoryFile,
      adequateWorkingCapitalFile: existingApplicantChecklist.financialSoundness.adequateWorkingCapitalFile,
      validInsuranceCoverageFile: existingApplicantChecklist.financialSoundness.validInsuranceCoverageFile,
      noFinancialFraudFile: existingApplicantChecklist.financialSoundness.noFinancialFraudFile,
    } : {
      auditedFinancialStatementsFile: null,
      positiveNetWorthFile: null,
      noLoanDefaultsFile: null,
      cleanCreditHistoryFile: null,
      adequateWorkingCapitalFile: null,
      validInsuranceCoverageFile: null,
      noFinancialFraudFile: null,
    };

    // Only assign documents when checkbox is true (to preserve files when checkbox is false)
    const fsDocumentsToAssign = [];
    if (dto.financialSoundness.auditedFinancialStatements) {
      fsDocumentsToAssign.push({
        id: fsEntity.auditedFinancialStatementsFile ?? dto.financialSoundness.auditedFinancialStatementsFile ?? null,
        type: 'FinancialSoundnessChecklist',
        documentType: 'auditedFinancialStatementsFile',
        entityId: fsEntity.id,
        oldId: oldFsDocumentIds.auditedFinancialStatementsFile,
      });
    }
    if (dto.financialSoundness.positiveNetWorth) {
      fsDocumentsToAssign.push({
        id: fsEntity.positiveNetWorthFile ?? dto.financialSoundness.positiveNetWorthFile ?? null,
        type: 'FinancialSoundnessChecklist',
        documentType: 'positiveNetWorthFile',
        entityId: fsEntity.id,
        oldId: oldFsDocumentIds.positiveNetWorthFile,
      });
    }
    if (dto.financialSoundness.noLoanDefaults) {
      fsDocumentsToAssign.push({
        id: fsEntity.noLoanDefaultsFile ?? dto.financialSoundness.noLoanDefaultsFile ?? null,
        type: 'FinancialSoundnessChecklist',
        documentType: 'noLoanDefaultsFile',
        entityId: fsEntity.id,
        oldId: oldFsDocumentIds.noLoanDefaultsFile,
      });
    }
    if (dto.financialSoundness.cleanCreditHistory) {
      fsDocumentsToAssign.push({
        id: fsEntity.cleanCreditHistoryFile ?? dto.financialSoundness.cleanCreditHistoryFile ?? null,
        type: 'FinancialSoundnessChecklist',
        documentType: 'cleanCreditHistoryFile',
        entityId: fsEntity.id,
        oldId: oldFsDocumentIds.cleanCreditHistoryFile,
      });
    }
    if (dto.financialSoundness.adequateWorkingCapital) {
      fsDocumentsToAssign.push({
        id: fsEntity.adequateWorkingCapitalFile ?? dto.financialSoundness.adequateWorkingCapitalFile ?? null,
        type: 'FinancialSoundnessChecklist',
        documentType: 'adequateWorkingCapitalFile',
        entityId: fsEntity.id,
        oldId: oldFsDocumentIds.adequateWorkingCapitalFile,
      });
    }
    if (dto.financialSoundness.validInsuranceCoverage) {
      fsDocumentsToAssign.push({
        id: fsEntity.validInsuranceCoverageFile ?? dto.financialSoundness.validInsuranceCoverageFile ?? null,
        type: 'FinancialSoundnessChecklist',
        documentType: 'validInsuranceCoverageFile',
        entityId: fsEntity.id,
        oldId: oldFsDocumentIds.validInsuranceCoverageFile,
      });
    }
    if (dto.financialSoundness.noFinancialFraud) {
      fsDocumentsToAssign.push({
        id: fsEntity.noFinancialFraudFile ?? dto.financialSoundness.noFinancialFraudFile ?? null,
        type: 'FinancialSoundnessChecklist',
        documentType: 'noFinancialFraudFile',
        entityId: fsEntity.id,
        oldId: oldFsDocumentIds.noFinancialFraudFile,
      });
    }
    if (fsDocumentsToAssign.length > 0) {
      await assignDocuments(fsDocumentsToAssign);
    }

    // Update or create Registration Fee
    const rfEntity = existingApplicantChecklist.registrationFee
      ? await this.updateRegistrationFee(
        existingApplicantChecklist.registrationFee,
        dto.registrationFee,
        repos.registrationFee,
      )
      : await this.createRegistrationFee(dto.registrationFee, existingApplicantChecklist, repos.registrationFee);

    if (!existingApplicantChecklist.registrationFee) {
      existingApplicantChecklist.registrationFee = rfEntity;
      existingApplicantChecklist.registrationFeeId = rfEntity.id;
    }

    // Get old document ID before update for unlinking
    const oldRfDocumentId = existingApplicantChecklist.registrationFee
      ? existingApplicantChecklist.registrationFee.bankPaymentSlip
      : null;

    await assignDocuments([
      {
        id: rfEntity.bankPaymentSlip ?? dto.registrationFee.bankPaymentSlip ?? null,
        type: 'RegistrationFeeChecklist',
        documentType: 'bankPaymentSlip',
        entityId: rfEntity.id,
        oldId: oldRfDocumentId,
      },
    ]);

    // Update or create Declaration
    if (existingApplicantChecklist.declaration) {
      Object.assign(existingApplicantChecklist.declaration, {
        informationTrueComplete: dto.declaration.informationTrueComplete,
        authorizeVerification: dto.declaration.authorizeVerification,
      });
      await repos.declaration.save(existingApplicantChecklist.declaration);
    } else {
      const newDeclaration = await repos.declaration.save(
        repos.declaration.create({
          ...dto.declaration,
          applicantChecklist: existingApplicantChecklist,
        }),
      );
      existingApplicantChecklist.declaration = newDeclaration;
      existingApplicantChecklist.declarationId = newDeclaration.id;
    }

    await repos.applicantChecklist.save(existingApplicantChecklist);
    return existingApplicantChecklist;
  }

  /**
   * Create new applicant checklist
   */
  private async createNewApplicantChecklist(
    dto: CreateApplicantChecklistDto,
    application: WarehouseOperatorApplicationRequest,
    repos: any,
    assignDocuments: Function,
  ) {
    const humanResources = await repos.humanResources.save(
      repos.humanResources.create({
        qcPersonnel: dto.humanResources.qcPersonnel,
        warehouseSupervisor: dto.humanResources.warehouseSupervisor,
        dataEntryOperator: dto.humanResources.dataEntryOperator,
        qcPersonnelFile: dto.humanResources.qcPersonnelFile ?? null,
        warehouseSupervisorFile: dto.humanResources.warehouseSupervisorFile ?? null,
        dataEntryOperatorFile: dto.humanResources.dataEntryOperatorFile ?? null,
      }),
    );

    const financialSoundness = await repos.financialSoundness.save(
      repos.financialSoundness.create({
        auditedFinancialStatements: dto.financialSoundness.auditedFinancialStatements,
        positiveNetWorth: dto.financialSoundness.positiveNetWorth,
        noLoanDefaults: dto.financialSoundness.noLoanDefaults,
        cleanCreditHistory: dto.financialSoundness.cleanCreditHistory,
        adequateWorkingCapital: dto.financialSoundness.adequateWorkingCapital,
        validInsuranceCoverage: dto.financialSoundness.validInsuranceCoverage,
        noFinancialFraud: dto.financialSoundness.noFinancialFraud,
        auditedFinancialStatementsFile: dto.financialSoundness.auditedFinancialStatementsFile ?? null,
        positiveNetWorthFile: dto.financialSoundness.positiveNetWorthFile ?? null,
        noLoanDefaultsFile: dto.financialSoundness.noLoanDefaultsFile ?? null,
        cleanCreditHistoryFile: dto.financialSoundness.cleanCreditHistoryFile ?? null,
        adequateWorkingCapitalFile: dto.financialSoundness.adequateWorkingCapitalFile ?? null,
        validInsuranceCoverageFile: dto.financialSoundness.validInsuranceCoverageFile ?? null,
        noFinancialFraudFile: dto.financialSoundness.noFinancialFraudFile ?? null,
      }),
    );

    const registrationFee = await repos.registrationFee.save(
      repos.registrationFee.create({
        bankPaymentSlip: dto.registrationFee.bankPaymentSlip ?? null,
      }),
    );

    const declaration = await repos.declaration.save(
      repos.declaration.create({
        informationTrueComplete: dto.declaration.informationTrueComplete,
        authorizeVerification: dto.declaration.authorizeVerification,
      }),
    );

    const applicantChecklist = repos.applicantChecklist.create({
      applicationId: application.id,
      humanResourcesId: humanResources.id,
      financialSoundnessId: financialSoundness.id,
      registrationFeeId: registrationFee.id,
      declarationId: declaration.id,
      humanResources,
      financialSoundness,
      registrationFee,
      declaration,
    });
    await repos.applicantChecklist.save(applicantChecklist);

    // Update child entities with applicantChecklist reference
    humanResources.applicantChecklist = applicantChecklist;
    await repos.humanResources.save(humanResources);

    financialSoundness.applicantChecklist = applicantChecklist;
    await repos.financialSoundness.save(financialSoundness);

    registrationFee.applicantChecklist = applicantChecklist;
    await repos.registrationFee.save(registrationFee);

    declaration.applicantChecklist = applicantChecklist;
    await repos.declaration.save(declaration);

    // Assign documents
    await assignDocuments([
      { id: dto.humanResources.qcPersonnelFile ?? null, type: 'HumanResourcesChecklist', documentType: 'qcPersonnelFile', entityId: humanResources.id },
      { id: dto.humanResources.warehouseSupervisorFile ?? null, type: 'HumanResourcesChecklist', documentType: 'warehouseSupervisorFile', entityId: humanResources.id },
      { id: dto.humanResources.dataEntryOperatorFile ?? null, type: 'HumanResourcesChecklist', documentType: 'dataEntryOperatorFile', entityId: humanResources.id },
      { id: dto.financialSoundness.auditedFinancialStatementsFile ?? null, type: 'FinancialSoundnessChecklist', documentType: 'auditedFinancialStatementsFile', entityId: financialSoundness.id },
      { id: dto.financialSoundness.positiveNetWorthFile ?? null, type: 'FinancialSoundnessChecklist', documentType: 'positiveNetWorthFile', entityId: financialSoundness.id },
      { id: dto.financialSoundness.noLoanDefaultsFile ?? null, type: 'FinancialSoundnessChecklist', documentType: 'noLoanDefaultsFile', entityId: financialSoundness.id },
      { id: dto.financialSoundness.cleanCreditHistoryFile ?? null, type: 'FinancialSoundnessChecklist', documentType: 'cleanCreditHistoryFile', entityId: financialSoundness.id },
      { id: dto.financialSoundness.adequateWorkingCapitalFile ?? null, type: 'FinancialSoundnessChecklist', documentType: 'adequateWorkingCapitalFile', entityId: financialSoundness.id },
      { id: dto.financialSoundness.validInsuranceCoverageFile ?? null, type: 'FinancialSoundnessChecklist', documentType: 'validInsuranceCoverageFile', entityId: financialSoundness.id },
      { id: dto.financialSoundness.noFinancialFraudFile ?? null, type: 'FinancialSoundnessChecklist', documentType: 'noFinancialFraudFile', entityId: financialSoundness.id },
      { id: dto.registrationFee.bankPaymentSlip ?? null, type: 'RegistrationFeeChecklist', documentType: 'bankPaymentSlip', entityId: registrationFee.id },
    ]);

    return applicantChecklist;
  }

  /**
   * Update Human Resources entity
   */
  private async updateHumanResources(
    existing: HumanResourcesChecklistEntity,
    dto: any,
    repo: Repository<HumanResourcesChecklistEntity>,
  ) {
    Object.assign(existing, {
      qcPersonnel: dto.qcPersonnel,
      warehouseSupervisor: dto.warehouseSupervisor,
      dataEntryOperator: dto.dataEntryOperator,
      // Only update file if checkbox is true or if a new file/document ID is explicitly provided
      // If checkbox is false, preserve existing file
      qcPersonnelFile: dto.qcPersonnel
        ? (dto.qcPersonnelFile ?? existing.qcPersonnelFile)
        : existing.qcPersonnelFile,
      warehouseSupervisorFile: dto.warehouseSupervisor
        ? (dto.warehouseSupervisorFile ?? existing.warehouseSupervisorFile)
        : existing.warehouseSupervisorFile,
      dataEntryOperatorFile: dto.dataEntryOperator
        ? (dto.dataEntryOperatorFile ?? existing.dataEntryOperatorFile)
        : existing.dataEntryOperatorFile,
    });
    return await repo.save(existing);
  }

  /**
   * Create Human Resources entity
   */
  private async createHumanResources(
    dto: any,
    checklist: ApplicantChecklistEntity,
    repo: Repository<HumanResourcesChecklistEntity>,
  ): Promise<HumanResourcesChecklistEntity> {
    const entity = repo.create({ ...dto, applicantChecklist: checklist });
    const saved = await repo.save(entity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  /**
   * Update Financial Soundness entity
   */
  private async updateFinancialSoundness(existing: any, dto: any, repo: Repository<any>) {
    Object.assign(existing, {
      auditedFinancialStatements: dto.auditedFinancialStatements,
      positiveNetWorth: dto.positiveNetWorth,
      noLoanDefaults: dto.noLoanDefaults,
      cleanCreditHistory: dto.cleanCreditHistory,
      adequateWorkingCapital: dto.adequateWorkingCapital,
      validInsuranceCoverage: dto.validInsuranceCoverage,
      noFinancialFraud: dto.noFinancialFraud,
      // Only update file if checkbox is true or if a new file/document ID is explicitly provided
      // If checkbox is false, preserve existing file
      auditedFinancialStatementsFile: dto.auditedFinancialStatements
        ? (dto.auditedFinancialStatementsFile ?? existing.auditedFinancialStatementsFile)
        : existing.auditedFinancialStatementsFile,
      positiveNetWorthFile: dto.positiveNetWorth
        ? (dto.positiveNetWorthFile ?? existing.positiveNetWorthFile)
        : existing.positiveNetWorthFile,
      noLoanDefaultsFile: dto.noLoanDefaults
        ? (dto.noLoanDefaultsFile ?? existing.noLoanDefaultsFile)
        : existing.noLoanDefaultsFile,
      cleanCreditHistoryFile: dto.cleanCreditHistory
        ? (dto.cleanCreditHistoryFile ?? existing.cleanCreditHistoryFile)
        : existing.cleanCreditHistoryFile,
      adequateWorkingCapitalFile: dto.adequateWorkingCapital
        ? (dto.adequateWorkingCapitalFile ?? existing.adequateWorkingCapitalFile)
        : existing.adequateWorkingCapitalFile,
      validInsuranceCoverageFile: dto.validInsuranceCoverage
        ? (dto.validInsuranceCoverageFile ?? existing.validInsuranceCoverageFile)
        : existing.validInsuranceCoverageFile,
      noFinancialFraudFile: dto.noFinancialFraud
        ? (dto.noFinancialFraudFile ?? existing.noFinancialFraudFile)
        : existing.noFinancialFraudFile,
    });
    return await repo.save(existing);
  }

  /**
   * Create Financial Soundness entity
   */
  private async createFinancialSoundness(dto: any, checklist: ApplicantChecklistEntity, repo: Repository<any>) {
    return await repo.save(repo.create({ ...dto, applicantChecklist: checklist }));
  }

  /**
   * Update Registration Fee entity
   */
  private async updateRegistrationFee(existing: any, dto: any, repo: Repository<any>) {
    Object.assign(existing, {
      bankPaymentSlip: dto.bankPaymentSlip ?? existing.bankPaymentSlip,
    });
    return await repo.save(existing);
  }

  /**
   * Create Registration Fee entity
   */
  private async createRegistrationFee(dto: any, checklist: ApplicantChecklistEntity, repo: Repository<any>) {
    return await repo.save(repo.create({ ...dto, applicantChecklist: checklist }));
  }


  private async getCompanyInformationData(companyInformationId: string) {
    const companyInformation = await this.companyInformationRepository.findOne({
      where: { id: companyInformationId },
      relations: ['ntcCertificate'],
    });

    if (!companyInformation) {
      throw new NotFoundException('Company information not found');
    }

    return {
      message: 'Company information retrieved successfully',
      data: {
        id: companyInformation.id,
        companyName: companyInformation.companyName,
        secpRegistrationNumber: companyInformation.secpRegistrationNumber,
        activeFilerStatus: companyInformation.activeFilerStatus,
        dateOfIncorporation: companyInformation.dateOfIncorporation,
        businessCommencementDate: companyInformation.businessCommencementDate,
        registeredOfficeAddress: companyInformation.registeredOfficeAddress,
        postalCode: companyInformation.postalCode,
        nationalTaxNumber: companyInformation.nationalTaxNumber,
        salesTaxRegistrationNumber: companyInformation.salesTaxRegistrationNumber,
        ntcCertificate: companyInformation.ntcCertificate
          ? {
            documentId: companyInformation.ntcCertificate.id,
            originalFileName: companyInformation.ntcCertificate.originalFileName ?? undefined,
          }
          : null,
      },
    };
  }

  /**
   * Get company information with related documents
   */
  async getCompanyInformationWithDocuments(companyInformationId: string) {
    const companyInformation = await this.companyInformationRepository.findOne({
      where: { id: companyInformationId }
    });

    if (!companyInformation) {
      throw new NotFoundException('Company information not found');
    }

    // Get NTC certificate document ID specifically
    const ntcCertificate = await this.warehouseDocumentRepository.findOne({
      where: {
        documentableType: 'CompanyInformation',
        documentableId: companyInformationId,
        documentType: 'ntcCertificate',
        isActive: true
      }
    });

    // Return with ntcCertificate ID only
    return {
      ...companyInformation,
      ntcCertificate: ntcCertificate?.id || undefined,
    } as CompanyInformation & { ntcCertificate?: string };
  }


  /**
   * Upload and create a warehouse document
   * Documents are linked to entities via polymorphic relationship (documentableType, documentableId)
   */
  async uploadWarehouseDocument(
    file: any,
    userId: string,
    documentableType: string,
    documentableId: string,
    documentType: string
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `File type '${fileExtension}' is not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
      );
    }

    // Validate file size (max 10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB`,
      );
    }

    // Generate unique filename
    const sanitizedFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, sanitizedFilename);
    const documentPath = `/uploads/${sanitizedFilename}`;

    // Save file to disk
    await fs.writeFile(filePath, file.buffer);

    // Detect MIME type
    const mimeType = file.mimetype || 'application/octet-stream';

    // Create document record
    const document = this.warehouseDocumentRepository.create({
      userId,
      documentableType,
      documentableId,
      documentType,
      originalFileName: file.originalname,
      filePath: documentPath,
      mimeType,
      isActive: true,
    });

    const savedDocument = await this.warehouseDocumentRepository.save(document);

    return {
      id: savedDocument.id,
      filePath: savedDocument.filePath,
      originalFileName: savedDocument.originalFileName,
      mimeType: savedDocument.mimeType,
    };
  }

  async createBankDetails(applicationId: string, createBankDetailsDto: CreateBankDetailsDto, userId: string) {
    const application = await this.warehouseOperatorRepository.findOne({ where: { id: applicationId, userId } });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // only allow updating after application is either new or resubmitted or rejected
    if (application.status != WarehouseOperatorApplicationStatus.DRAFT) {
      throw new BadRequestException('Cannot Add new Bank Details. Bank Details can only be updated.');
    }

    // Check if bank details already exists for this application
    const existingBankDetails = await this.bankDetailsRepository.findOne({
      where: { applicationId: application.id }
    });

    if (existingBankDetails) {
      throw new BadRequestException('Bank details already exists for this application. Please update instead of creating a new one.');
    }

    // if (
    //   ![WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED]
    //     .includes(application.status)
    // ) {
    //   throw new BadRequestException('Cannot update bank details after application is submitted');
    // }

    const bankDetails = this.bankDetailsRepository.create({
      applicationId: application.id,
      name: createBankDetailsDto.name,
      accountTitle: createBankDetailsDto.accountTitle,
      iban: createBankDetailsDto.iban,
      accountType: createBankDetailsDto.accountType,
      branchAddress: createBankDetailsDto.branchAddress,
      status: StepStatus.DRAFT,
    });

    await this.bankDetailsRepository.save(bankDetails);

    return {
      message: 'Bank details saved successfully',
      bankDetailsId: bankDetails.id,
    };
  }

  private async getBankDetailsData(bankDetailsId: string) {
    const bankDetails = await this.bankDetailsRepository.findOne({
      where: { id: bankDetailsId },
    });

    if (!bankDetails) {
      throw new NotFoundException('Bank Details not found');
    }

    return {
      message: 'Bank Details retrieved successfully',
      data: {
        id: bankDetails.id,
        name: bankDetails.name,
        accountTitle: bankDetails.accountTitle,
        iban: bankDetails.iban,
        accountType: bankDetails.accountType,
        branchAddress: bankDetails.branchAddress,
      }
    };
  }

  async updateBankDetails(
    applicationId: string,
    bankDetailsId: string,
    updateBankDetailsDto: UpdateBankDetailsDto,
    userId: string
  ) {
    // First, validate the record exists and user has access (outside transaction for early validation)
    const application = await this.warehouseOperatorRepository.findOne({ where: { id: applicationId, userId } });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(application.status)) {
      throw new BadRequestException('Cannot update bank details after application is approved or submitted');
    }

    const bankDetails = await this.bankDetailsRepository.findOne({ where: { id: bankDetailsId, applicationId } });
    if (!bankDetails) {
      throw new NotFoundException('Bank details not found');
    }

    // Use transaction to ensure atomicity: history save and update must both succeed or both fail
    const result = await this.dataSource.transaction(async (manager) => {
      const bankDetailsRepo = manager.getRepository(BankDetails);
      const historyRepo = manager.getRepository(BankDetailsHistory);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);

      // Reload within transaction to ensure we have the latest data
      const appInTransaction = await appRepo.findOne({
        where: { id: applicationId, userId },
      });

      if (!appInTransaction) {
        throw new NotFoundException('Application not found');
      }

      // Re-validate application status inside transaction to prevent race conditions
      if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(appInTransaction.status)) {
        throw new BadRequestException('Cannot update bank details after application is approved or submitted');
      }

      const bankDetailsInTransaction = await bankDetailsRepo.findOne({
        where: { id: bankDetailsId, applicationId: appInTransaction.id },
      });

      if (!bankDetailsInTransaction) {
        throw new NotFoundException('Bank details not found');
      }

      // Save history of bank details if application is rejected (before overwriting)
      if (appInTransaction.status === WarehouseOperatorApplicationStatus.REJECTED) {
        const historyRecord = historyRepo.create({
          applicationId: bankDetailsInTransaction.applicationId,
          bankDetailsId: bankDetailsInTransaction.id,
          name: bankDetailsInTransaction.name,
          accountTitle: bankDetailsInTransaction.accountTitle,
          iban: bankDetailsInTransaction.iban,
          accountType: bankDetailsInTransaction.accountType,
          branchAddress: bankDetailsInTransaction.branchAddress,
          status: bankDetailsInTransaction.status,
          isActive: false,
        });

        // Preserve the original createdAt timestamp from the bank details record
        historyRecord.createdAt = bankDetailsInTransaction.createdAt;

        await historyRepo.save(historyRecord);
      }

      // Overwrite existing bank details with new information
      bankDetailsInTransaction.name = updateBankDetailsDto.name;
      bankDetailsInTransaction.accountTitle = updateBankDetailsDto.accountTitle;
      bankDetailsInTransaction.iban = updateBankDetailsDto.iban;
      bankDetailsInTransaction.accountType = updateBankDetailsDto.accountType as AccountType;
      bankDetailsInTransaction.branchAddress = updateBankDetailsDto.branchAddress ?? '';

      const updatedBankDetails = await bankDetailsRepo.save(bankDetailsInTransaction);

      return {
        bankDetails: updatedBankDetails,
        applicationId: appInTransaction.applicationId,
      };
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (application.status === WarehouseOperatorApplicationStatus.REJECTED) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for bank details if it exists
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationId: applicationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '3-bank-details',
            resourceId: bankDetailsId,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      await this.trackResubmissionAndUpdateStatus(
        applicationId,
        '3-bank-details',
        bankDetailsId,
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: 'Bank details updated successfully',
      bankDetails: result.bankDetails,
      applicationId: result.applicationId,
    };
  }

  async findByUserId(userId: string) {
    return await this.warehouseOperatorRepository.find({ where: { userId } });
  }

  async generateApplicationId() {
    // Count existing application requests to generate next ID
    const count = await this.warehouseOperatorRepository.count();
    let attempt = 0;
    const maxAttempts = 100;

    while (attempt < maxAttempts) {
      const applicationId = `WHO-${String(count + attempt + 1).padStart(6, '0')}`;

      // Check if this ID already exists
      const existing = await this.warehouseOperatorRepository.findOne({
        where: { applicationId },
      });

      if (!existing) {
        return applicationId;
      }

      attempt++;
    }

    // Fallback: use timestamp if all attempts fail (shouldn't happen)
    const timestamp = Date.now();
    return `WHO-${timestamp.toString().slice(-6)}`;
  }

  async findOneWarehouseOperator(id: string, userId: string) {
    const warehouseOperatorApplication = await this.warehouseOperatorRepository.findOne({
      where: {
        id,
        userId
      },
      relations: ['authorizedSignatories' as 'Authorized Signatory', 'rejections']
    });

    console.log('warehouseOperatorApplication------', warehouseOperatorApplication);
    if (!warehouseOperatorApplication) {
      throw new NotFoundException('Warehouse operator application not found');
    }

    return warehouseOperatorApplication;
  }

  findAll() {
    return `This action returns all warehouse`;
  }

  findOne(id: number) {
    return `This action returns a #${id} warehouse`;
  }

  update(id: number, updateWarehouseDto: UpdateWarehouseDto) {
    return `This action updates a #${id} warehouse`;
  }

  remove(id: number) {
    return `This action removes a #${id} warehouse`;
  }

  private mapHrEntityToResponse(hr: HrEntity) {
    return {
      id: hr.id,
      personalDetails: hr.personalDetails
        ? {
          id: hr.personalDetails.id,
          designationId: hr.personalDetails.designationId,
          designationName: hr.personalDetails.designation?.name ?? null,
          name: hr.personalDetails.name,
          fathersHusbandName: hr.personalDetails.fathersHusbandName,
          cnicPassport: hr.personalDetails.cnicPassport,
          nationality: hr.personalDetails.nationality,
          dateOfBirth: hr.personalDetails.dateOfBirth,
          residentialAddress: hr.personalDetails.residentialAddress,
          businessAddress: hr.personalDetails.businessAddress ?? null,
          telephone: hr.personalDetails.telephone ?? null,
          mobileNumber: hr.personalDetails.mobileNumber,
          email: hr.personalDetails.email,
          nationalTaxNumber: hr.personalDetails.nationalTaxNumber ?? null,
          photograph: hr.personalDetails.photographDocument && hr.personalDetails.photograph
            ? {
              documentId: hr.personalDetails.photograph,
              originalFileName: hr.personalDetails.photographDocument?.originalFileName ?? undefined,
            }
            : null,
        }
        : null,
      academicQualifications: hr.academicQualifications?.map((item) => ({
        id: item.id,
        degree: item.degree,
        major: item.major,
        institute: item.institute,
        country: item.country,
        yearOfPassing: item.yearOfPassing,
        grade: item.grade ?? null,
        academicCertificate: item.academicCertificateDocument
          ? {
            documentId: item.academicCertificate,
            originalFileName: item.academicCertificateDocument.originalFileName ?? undefined,
          }
          : null,
      })) ?? [],
      professionalQualifications: hr.professionalQualifications?.map((item) => ({
        id: item.id,
        certificationTitle: item.certificationTitle,
        issuingBody: item.issuingBody,
        country: item.country,
        dateOfAward: item.dateOfAward,
        validity: item.validity ?? null,
        membershipNumber: item.membershipNumber ?? null,
        professionalCertificate: item.professionalCertificateDocument
          ? {
            documentId: item.professionalCertificate,
            originalFileName: item.professionalCertificateDocument.originalFileName ?? undefined,
          }
          : null,
      })) ?? [],
      trainings: hr.trainings?.map((item) => ({
        id: item.id,
        trainingTitle: item.trainingTitle,
        conductedBy: item.conductedBy,
        trainingType: item.trainingType,
        durationStart: item.durationStart,
        durationEnd: item.durationEnd,
        dateOfCompletion: item.dateOfCompletion,
        trainingCertificate: item.trainingCertificateDocument
          ? {
            documentId: item.trainingCertificate,
            originalFileName: item.trainingCertificateDocument.originalFileName ?? undefined,
          }
          : null,
      })) ?? [],
      experiences: hr.experiences?.map((item) => ({
        id: item.id,
        positionHeld: item.positionHeld,
        organizationName: item.organizationName,
        organizationAddress: item.organizationAddress,
        natureOfOrganization: item.natureOfOrganization,
        dateOfAppointment: item.dateOfAppointment,
        dateOfLeaving: item.dateOfLeaving ?? null,
        duration: item.duration ?? null,
        responsibilities: item.responsibilities ?? null,
        experienceLetter: item.experienceLetterDocument
          ? {
            documentId: item.experienceLetter,
            originalFileName: item.experienceLetterDocument.originalFileName ?? undefined,
          }
          : null,
      })) ?? [],
      declaration: hr.declaration
        ? {
          id: hr.declaration.id,
          writeOffAvailed: hr.declaration.writeOffAvailed,
          defaultOfFinance: hr.declaration.defaultOfFinance,
          placementOnECL: hr.declaration.placementOnECL,
          convictionPleaBargain: hr.declaration.convictionPleaBargain,
        }
        : null,
    };
  }

  private async mapFinancialInformationEntityToResponse(financialInfo: FinancialInformationEntity) {
    // Get all documents for audit report if it exists
    let auditReportDocuments: any[] = [];
    if (financialInfo.auditReport) {
      auditReportDocuments = await this.warehouseDocumentRepository.find({
        where: {
          documentableType: 'AuditReport',
          documentableId: financialInfo.auditReport.id,
        },
        order: {
          createdAt: 'ASC',
        },
      });
    }

    // Get all documents for tax return if it exists
    let taxReturnDocuments: any[] = [];
    if (financialInfo.taxReturns?.[0]) {
      taxReturnDocuments = await this.warehouseDocumentRepository.find({
        where: {
          documentableType: 'TaxReturn',
          documentableId: financialInfo.taxReturns[0].id,
        },
        order: {
          createdAt: 'ASC',
        },
      });
    }

    return {
      id: financialInfo.id,
      auditReport: financialInfo.auditReport
        ? {
          id: financialInfo.auditReport.id,
          documentType: financialInfo.auditReport.documentType,
          documentName: financialInfo.auditReport.documentName,
          periodStart: financialInfo.auditReport.periodStart,
          periodEnd: financialInfo.auditReport.periodEnd,
          assets: financialInfo.auditReport.assets,
          liabilities: financialInfo.auditReport.liabilities,
          equity: financialInfo.auditReport.equity,
          revenue: financialInfo.auditReport.revenue,
          netProfitLoss: financialInfo.auditReport.netProfitLoss,
          remarks: financialInfo.auditReport.remarks ?? null,
          // Keep single document for backward compatibility
          document: financialInfo.auditReport.document && financialInfo.auditReport.document.id
            ? {
              documentId: financialInfo.auditReport.document.id,
              originalFileName: financialInfo.auditReport.document.originalFileName ?? undefined,
            }
            : null,
          // Include all documents array
          documents: auditReportDocuments.length > 0
            ? auditReportDocuments.map((doc) => ({
              documentId: doc.id,
              originalFileName: doc.originalFileName ?? undefined,
            }))
            : undefined,
        }
        : null,
      taxReturn: financialInfo.taxReturns?.[0]
        ? {
          id: financialInfo.taxReturns[0].id,
          documentType: financialInfo.taxReturns[0].documentType,
          documentName: financialInfo.taxReturns[0].documentName,
          periodStart: financialInfo.taxReturns[0].periodStart,
          periodEnd: financialInfo.taxReturns[0].periodEnd,
          remarks: financialInfo.taxReturns[0].remarks ?? null,
          // Keep single document for backward compatibility
          document: financialInfo.taxReturns[0].document && financialInfo.taxReturns[0].document.id
            ? {
              documentId: financialInfo.taxReturns[0].document.id,
              originalFileName: financialInfo.taxReturns[0].document.originalFileName ?? undefined,
            }
            : null,
          // Include all documents array
          documents: taxReturnDocuments.length > 0
            ? taxReturnDocuments.map((doc) => ({
              documentId: doc.id,
              originalFileName: doc.originalFileName ?? undefined,
            }))
            : undefined,
        }
        : null,
      bankStatement: financialInfo.bankStatements?.[0]
        ? {
          id: financialInfo.bankStatements[0].id,
          documentType: financialInfo.bankStatements[0].documentType,
          documentName: financialInfo.bankStatements[0].documentName,
          periodStart: financialInfo.bankStatements[0].periodStart,
          periodEnd: financialInfo.bankStatements[0].periodEnd,
          remarks: financialInfo.bankStatements[0].remarks ?? null,
          bankDocument: financialInfo.bankStatements[0].document && financialInfo.bankStatements[0].document.id
            ? {
              documentId: financialInfo.bankStatements[0].document.id,
              originalFileName: financialInfo.bankStatements[0].document.originalFileName ?? undefined,
            }
            : null,
        }
        : null,
      other: financialInfo.others && financialInfo.others.length > 0
        ? financialInfo.others.map((other) => ({
          id: other.id,
          documentType: other.documentType,
          documentName: other.documentName,
          periodStart: other.periodStart,
          periodEnd: other.periodEnd,
          remarks: other.remarks ?? null,
          document: other.document && other.document.id
            ? {
              documentId: other.document.id,
              originalFileName: other.document.originalFileName ?? undefined,
            }
            : null,
        }))
        : [],
    };
  }

  private mapApplicantChecklistEntityToResponse(checklist: ApplicantChecklistEntity) {
    return {
      id: checklist.id,
      humanResources: checklist.humanResources
        ? {
          id: checklist.humanResources.id,
          qcPersonnel: checklist.humanResources.qcPersonnel,
          qcPersonnelFile: checklist.humanResources.qcPersonnelDocument
            ? {
              documentId: checklist.humanResources.qcPersonnelFile,
              originalFileName: checklist.humanResources.qcPersonnelDocument.originalFileName ?? undefined,
            }
            : null,
          warehouseSupervisor: checklist.humanResources.warehouseSupervisor,
          warehouseSupervisorFile: checklist.humanResources.warehouseSupervisorDocument
            ? {
              documentId: checklist.humanResources.warehouseSupervisorFile,
              originalFileName: checklist.humanResources.warehouseSupervisorDocument.originalFileName ?? undefined,
            }
            : null,
          dataEntryOperator: checklist.humanResources.dataEntryOperator,
          dataEntryOperatorFile: checklist.humanResources.dataEntryOperatorDocument
            ? {
              documentId: checklist.humanResources.dataEntryOperatorFile,
              originalFileName: checklist.humanResources.dataEntryOperatorDocument.originalFileName ?? undefined,
            }
            : null,
        }
        : null,
      financialSoundness: checklist.financialSoundness
        ? {
          id: checklist.financialSoundness.id,
          auditedFinancialStatements: checklist.financialSoundness.auditedFinancialStatements,
          auditedFinancialStatementsFile: checklist.financialSoundness.auditedFinancialStatementsDocument
            ? {
              documentId: checklist.financialSoundness.auditedFinancialStatementsFile,
              originalFileName: checklist.financialSoundness.auditedFinancialStatementsDocument.originalFileName ?? undefined,
            }
            : null,
          positiveNetWorth: checklist.financialSoundness.positiveNetWorth,
          positiveNetWorthFile: checklist.financialSoundness.positiveNetWorthDocument
            ? {
              documentId: checklist.financialSoundness.positiveNetWorthFile,
              originalFileName: checklist.financialSoundness.positiveNetWorthDocument.originalFileName ?? undefined,
            }
            : null,
          noLoanDefaults: checklist.financialSoundness.noLoanDefaults,
          noLoanDefaultsFile: checklist.financialSoundness.noLoanDefaultsDocument
            ? {
              documentId: checklist.financialSoundness.noLoanDefaultsFile,
              originalFileName: checklist.financialSoundness.noLoanDefaultsDocument.originalFileName ?? undefined,
            }
            : null,
          cleanCreditHistory: checklist.financialSoundness.cleanCreditHistory,
          cleanCreditHistoryFile: checklist.financialSoundness.cleanCreditHistoryDocument
            ? {
              documentId: checklist.financialSoundness.cleanCreditHistoryFile,
              originalFileName: checklist.financialSoundness.cleanCreditHistoryDocument.originalFileName ?? undefined,
            }
            : null,
          adequateWorkingCapital: checklist.financialSoundness.adequateWorkingCapital,
          adequateWorkingCapitalFile: checklist.financialSoundness.adequateWorkingCapitalDocument
            ? {
              documentId: checklist.financialSoundness.adequateWorkingCapitalFile,
              originalFileName: checklist.financialSoundness.adequateWorkingCapitalDocument.originalFileName ?? undefined,
            }
            : null,
          validInsuranceCoverage: checklist.financialSoundness.validInsuranceCoverage,
          validInsuranceCoverageFile: checklist.financialSoundness.validInsuranceCoverageDocument
            ? {
              documentId: checklist.financialSoundness.validInsuranceCoverageFile,
              originalFileName: checklist.financialSoundness.validInsuranceCoverageDocument.originalFileName ?? undefined,
            }
            : null,
          noFinancialFraud: checklist.financialSoundness.noFinancialFraud,
          noFinancialFraudFile: checklist.financialSoundness.noFinancialFraudDocument
            ? {
              documentId: checklist.financialSoundness.noFinancialFraudFile,
              originalFileName: checklist.financialSoundness.noFinancialFraudDocument.originalFileName ?? undefined,
            }
            : null,
        }
        : null,
      registrationFee: checklist.registrationFee
        ? {
          id: checklist.registrationFee.id,
          bankPaymentSlip: checklist.registrationFee.bankPaymentSlipDocument
            ? {
              documentId: checklist.registrationFee.bankPaymentSlip,
              originalFileName: checklist.registrationFee.bankPaymentSlipDocument.originalFileName ?? undefined,
            }
            : null,
        }
        : null,
      declaration: checklist.declaration
        ? {
          id: checklist.declaration.id,
          informationTrueComplete: checklist.declaration.informationTrueComplete,
          authorizeVerification: checklist.declaration.authorizeVerification,
        }
        : null,
    };
  }

  async getWarehouseApplicationStatus(userId: string) {
    // Get the most recent application (ordered by createdAt DESC)
    const application = await this.warehouseOperatorRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' }
    });

    if (!application) {
      return {
        message: 'No warehouse operator application found',
        data: {
          hasApplication: false,
          status: null,
        },
      };
    }

    return {
      message: 'Warehouse application status retrieved successfully',
      data: {
        hasApplication: true,
        status: application.status,
        applicationId: application.id,
        createdAt: application.createdAt,
      },
    };
  }

  async getResourceStatus(applicationId: string, userId: string, resourceType: 'bank-statement' | 'company-information' | 'tax-return' | 'other' | 'hr' | 'authorized-signatories' | 'financial-information' | 'applicant-checklist') {
    let application: WarehouseOperatorApplicationRequest | WarehouseLocation | null = null;
    let isLocationApplication = false;
    // CHECK IF THE APPLICATION IS A WAREHOUSE OPERATOR APPLICATION
    application = await this.warehouseOperatorRepository.findOne({
      where: {
        id: applicationId, userId
      },
      select: {
        id: true
      }
    });
    if (!application) {
      // CHECK IF THE APPLICATION IS A WAREHOUSE LOCATION APPLICATION
      application = await this.dataSource.getRepository(WarehouseLocation).findOne({
        where: { id: applicationId },
      });
      isLocationApplication = true;
    }
    // IF THE APPLICATION IS NOT FOUND, THROW AN ERROR
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    let resourceArr: string[] = ['bank-statement', 'company-information', 'tax-return', 'other', 'hr', 'authorized-signatories', 'financial-information', 'applicant-checklist'];
    if (isLocationApplication) {
      resourceArr = [
        'facility', 'contact', 'jurisdiction', 'security-fire-safety', 'weighing', 'technical-qualitative', 'human-resources', 'checklist'
      ];
    }

    if (!resourceType || !resourceArr.includes(resourceType)) {
      throw new BadRequestException('Invalid resource type.');
    }

    // check for assignments for the user and application
    const assignments = await this.assignmentRepository.find({
      where: {
        ...(isLocationApplication ?
          { applicationLocationId: applicationId } :
          { applicationId: applicationId }),
        assignedTo: userId,
        level: AssignmentLevel.HOD_TO_APPLICANT
      }
    });

    let unlockedSections: string[] = [];
    if (assignments && assignments.length > 0) {
      // check in assignmentSection table against assignment
      const assignmentSections = await this.assignmentSectionRepository.find({
        where: {
          assignmentId: In(assignments.map((assignment) => assignment.id))
        },
        select: {
          resourceId: true,
          sectionType: true,
        }
      });

      // get all sections
      const filteredSections = assignmentSections.filter(section => {
        if (isLocationApplication) {
          switch (section.resourceType) {
            case 'facility':
              return section.sectionType === '1-facility';
            case 'contact':
              return section.sectionType === '2-contact';
            case 'jurisdiction':
              return section.sectionType === '3-jurisdiction';
            case 'security-fire-safety':
              return section.sectionType === '4-security-fire-safety';
            case 'weighing':
              return section.sectionType === '5-weighing';
            case 'technical-qualitative':
              return section.sectionType === '6-technical-qualitative';
            case 'human-resources':
              return section.sectionType === '7-human-resources';
            case 'checklist':
              return section.sectionType === '8-checklist';
          }
        } else {
          switch (resourceType) {
            case 'hr':
              return section.sectionType === '4-hr-information';
            case 'authorized-signatories':
              return section.sectionType === '1-authorize-signatory-information';
            case 'bank-statement':
              return section.sectionType === '3-bank-details';
            case 'company-information':
              return section.sectionType === '2-company-information';
            case 'financial-information':
              return section.sectionType === '5-financial-information';
            case 'applicant-checklist':
              return section.sectionType === '6-application-checklist-questionnaire';
          }
        }
      });

      unlockedSections = filteredSections.map((section) => section.resourceId as string).filter((id): id is string => id !== null && id !== undefined);
    }

    return {
      message: 'Resource status retrieved successfully',
      data: {
        unlockedSections: unlockedSections,
      },
    };
  }

  /**
   * Get resubmission progress for a rejected application
   * Shows how many sections were rejected and how many have been resubmitted
   * 
   * @param applicationId - The warehouse operator application ID
   * @param userId - The user ID to verify ownership
   * @returns Progress information including total rejected, resubmitted, remaining, and breakdown by section type
   */
  async getResubmissionProgress(applicationId: string, userId: string) {
    let isLocationApplication = false;
    // Verify application exists and user owns it
    let application: WarehouseOperatorApplicationRequest | WarehouseLocation | null = null;
    application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
      relations: ['rejections'],
    });
    if (!application) {
      application = await this.dataSource.getRepository(WarehouseLocation).findOne({
        where: { id: applicationId },
        relations: ['rejections'],
      });
      isLocationApplication = true;
    }
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Only show progress for rejected applications
    if (application.status !== WarehouseOperatorApplicationStatus.REJECTED) {
      return {
        message: 'Application is not in rejected status',
        data: {
          totalRejected: 0,
          totalResubmitted: 0,
          remaining: 0,
          progressPercentage: 100,
          sections: [],
        },
      };
    }

    // Map normalized section types to display names
    let sectionTypeMap: Record<string, string[]> = {};
    if (isLocationApplication) {
      sectionTypeMap = {
        '1-facility': ['1-facility'],
        '2-contact': ['2-contact'],
        '3-jurisdiction': ['3-jurisdiction'],
        '4-security-fire-safety': ['4-security-fire-safety'],
        '5-weighing': ['5-weighing'],
        '6-technical-qualitative': ['6-technical-qualitative'],
        '7-human-resources': ['7-human-resources'],
        '8-checklist': ['8-checklist'],
      };
    } else {
      sectionTypeMap = {
        '1-authorize-signatory-information': ['1-authorize-signatory-information'],
        '2-company-information': ['2-company-information'],
        '3-bank-details': ['3-bank-details'],
        '4-hr-information': ['4-hr-information'],
        '5-financial-information': ['5-financial-information'],
        '6-application-checklist-questionnaire': ['6-application-checklist-questionnaire'],
      };
    }

    let sectionDisplayNames: Record<string, string> = {};
    // Section type to human-readable name mapping
    if (isLocationApplication) {
      sectionDisplayNames = {
        '1-facility': 'Facility Information',
        '2-contact': 'Contact Information',
        '3-jurisdiction': 'Jurisdiction',
        '4-security-fire-safety': 'Security & Fire Safety',
        '5-weighing': 'Weighing',
        '6-technical-qualitative': 'Technical & Qualitative',
        '7-human-resources': 'Human Resources',
        '8-checklist': 'Checklist',
      };
    } else {
      sectionDisplayNames = {
        '1-authorize-signatory-information': 'Authorized Signatory Information',
        '2-company-information': 'Company Information',
        '3-bank-details': 'Bank Details',
        '4-hr-information': 'HR Information',
        '5-financial-information': 'Financial Information',
        '6-application-checklist-questionnaire': 'Applicant Checklist',
      };
    }

    // Get all unique unlocked sections from rejections
    // unlockedSections is a JSONB array, so we need to parse if it's a string
    const allUnlockedSections = (application.rejections || [])
      .flatMap((rejection) => {
        const sections = rejection.unlockedSections || [];
        // Handle both string and parsed JSON formats
        return sections.map((section: string) => {
          try {
            // If it's a JSON string, parse it; otherwise use as-is
            return typeof section === 'string' && section.startsWith('"') ? JSON.parse(section) : section;
          } catch {
            return section;
          }
        });
      })
      .filter((section, index, self) => self.indexOf(section) === index); // unique

    if (allUnlockedSections.length === 0) {
      return {
        message: 'No rejected sections found',
        data: {
          totalRejected: 0,
          totalResubmitted: 0,
          remaining: 0,
          progressPercentage: 100,
          sections: [],
        },
      };
    }

    // Get all assignments for this application with HOD_TO_APPLICANT level and REJECTED status
    const assignments = await this.assignmentRepository.find({
      where: {
        ...(isLocationApplication ?
          { applicationLocationId: applicationId } :
          { applicationId: applicationId }),
        level: AssignmentLevel.HOD_TO_APPLICANT,
        status: AssignmentStatus.REJECTED,
      },
    });

    if (assignments.length === 0) {
      return {
        message: 'No rejected assignments found',
        data: {
          totalRejected: 0,
          totalResubmitted: 0,
          remaining: 0,
          progressPercentage: 100,
          sections: [],
        },
      };
    }

    // Get all assignment sections for these assignments
    const assignmentSections = await this.assignmentSectionRepository.find({
      where: {
        assignmentId: In(assignments.map((a) => a.id)),
      },
    });

    // Get all resubmitted sections for this application
    const resubmittedSections = await this.resubmittedSectionRepository.find({
      where: { ...(isLocationApplication ?
        { warehouseLocationId: applicationId } :
        { applicationId: applicationId }), },
    });

    // Group assignment sections by normalized section type
    const sectionsByType = new Map<string, typeof assignmentSections>();

    for (const unlockedSection of allUnlockedSections) {
      // Find normalized type for this unlocked section
      let normalizedType: string | null = null;
      for (const [normalized, displayNames] of Object.entries(sectionTypeMap)) {
        if (displayNames.some((displayName) => unlockedSection.includes(displayName) || displayName.includes(unlockedSection))) {
          normalizedType = normalized;
          break;
        }
      }

      // If no mapping found, try to normalize directly
      if (!normalizedType) {
        normalizedType = unlockedSection.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      }

      // Get all assignment sections for this section type
      const sectionsForType = assignmentSections.filter((section) => {
        if (!normalizedType) return false;
        return section.sectionType === normalizedType ||
          section.sectionType.includes(normalizedType) ||
          normalizedType.includes(section.sectionType);
      });

      if (sectionsForType.length > 0 && normalizedType) {
        sectionsByType.set(normalizedType, sectionsForType);
      }
    }

    // Calculate progress for each section type
    const sectionProgress = Array.from(sectionsByType.entries()).map(([sectionType, sections]) => {
      const resourceIds = sections
        .map((section) => section.resourceId)
        .filter((id): id is string => id !== null && id !== undefined);

      // Count resubmitted sections for this type
      const resubmittedForType = resubmittedSections.filter((resubmitted) => {
        // Match by section type
        const typeMatches = resubmitted.sectionType === sectionType ||
          resubmitted.sectionType.includes(sectionType) ||
          sectionType.includes(resubmitted.sectionType);

        if (!typeMatches) return false;

        // If there are resourceIds, match by resourceId
        if (resourceIds.length > 0) {
          if (!resubmitted.resourceId) return false;
          return resourceIds.includes(resubmitted.resourceId);
        }

        // If no resourceIds, any resubmission for this type counts
        return true;
      });

      const resubmittedIds = new Set(
        resubmittedForType
          .map((r) => r.resourceId)
          .filter((id): id is string => id !== null && id !== undefined)
      );

      // Count how many resourceIds have been resubmitted
      const resubmittedCount = resourceIds.length > 0
        ? resourceIds.filter((resourceId) => resubmittedIds.has(resourceId)).length
        : (resubmittedForType.length > 0 ? sections.length : 0);

      const rejectedCount = sections.length;
      const remainingCount = rejectedCount - resubmittedCount;
      const isComplete = remainingCount === 0;

      return {
        sectionType,
        sectionName: sectionDisplayNames[sectionType] || sectionType,
        rejected: rejectedCount,
        resubmitted: resubmittedCount,
        remaining: remainingCount,
        isComplete,
      };
    });

    // Calculate totals
    const totalRejected = sectionProgress.reduce((sum, section) => sum + section.rejected, 0);
    const totalResubmitted = sectionProgress.reduce((sum, section) => sum + section.resubmitted, 0);
    const remaining = totalRejected - totalResubmitted;
    const progressPercentage = totalRejected > 0 ? Math.round((totalResubmitted / totalRejected) * 100) : 100;

    return {
      message: 'Resubmission progress retrieved successfully',
      data: {
        totalRejected,
        totalResubmitted,
        remaining,
        progressPercentage,
        sections: sectionProgress,
      },
    };
  }

  /**
   * Helper function to track resubmitted sections and update application status
   * when all unlocked sections have been resubmitted.
   * 
   * @param applicationId - The warehouse operator application ID
   * @param sectionType - The normalized section type (e.g., "1-authorize-signatory-information")
   * @param resourceId - Optional resource ID for sections with multiple resources (e.g., HR entity ID, authorized signatory ID)
   * @param assignmentSectionId - Optional assignment section ID to link the resubmission
   * @param manager - Optional EntityManager for use within transactions
   */
  private async trackResubmissionAndUpdateStatus(
    applicationId: string,
    sectionType: string,
    resourceId?: string | null,
    assignmentSectionId?: string | null,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager || this.dataSource.manager;
    const resubmittedSectionRepo = repo.getRepository(ResubmittedSectionEntity);
    const applicationRepo = repo.getRepository(WarehouseOperatorApplicationRequest);
    const assignmentRepo = repo.getRepository(Assignment);
    const assignmentSectionRepo = repo.getRepository(AssignmentSection);

    // Get application with rejections
    const application = await applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['rejections'],
    });

    if (!application) {
      return; // Application not found, skip tracking
    }

    // Only track if application is in REJECTED status
    if (application.status !== WarehouseOperatorApplicationStatus.REJECTED) {
      return;
    }

    // Map normalized section types to display names used in unlockedSections
    const sectionTypeMap: Record<string, string[]> = {
      '1-authorize-signatory-information': ['1-authorize-signatory-information'],
      '2-company-information': ['2-company-information'],
      '3-bank-details': ['3-bank-details'],
      '4-hr-information': ['4-hr-information'],
      '5-financial-information': ['5-financial-information'],
      '6-application-checklist-questionnaire': ['6-application-checklist-questionnaire'],
    };

    // Find the display name for this section type
    const displaySectionNames: string[] = [];
    for (const [normalized, displayNames] of Object.entries(sectionTypeMap)) {
      if (normalized === sectionType || sectionType.includes(normalized) || normalized.includes(sectionType)) {
        displaySectionNames.push(...displayNames);
        break;
      }
    }

    // If no mapping found, use the sectionType as-is
    if (displaySectionNames.length === 0) {
      displaySectionNames.push(sectionType);
    }

    // Check if any rejection has this section unlocked
    const hasUnlockedSection = application.rejections.some((rejection) =>
      rejection.unlockedSections?.some((unlocked) =>
        displaySectionNames.some((displayName) => unlocked.includes(displayName) || displayName.includes(unlocked))
      )
    );

    if (!hasUnlockedSection) {
      return; // This section is not unlocked, no need to track
    }

    // Record the resubmission
    const whereClause: any = {
      applicationId,
      sectionType,
    };
    if (resourceId !== undefined && resourceId !== null) {
      whereClause.resourceId = resourceId;
    } else {
      whereClause.resourceId = null;
    }
    if (assignmentSectionId !== undefined && assignmentSectionId !== null) {
      whereClause.assignmentSectionId = assignmentSectionId;
    } else {
      whereClause.assignmentSectionId = null;
    }

    const existingResubmission = await resubmittedSectionRepo.findOne({
      where: whereClause,
    });

    if (!existingResubmission) {
      const resubmittedSection = resubmittedSectionRepo.create({
        applicationId,
        sectionType,
        resourceId: resourceId ?? undefined,
        assignmentSectionId: assignmentSectionId ?? undefined,
      });
      await resubmittedSectionRepo.save(resubmittedSection);
    }

    // Get all assignments for this application with HOD_TO_APPLICANT level and REJECTED status
    const assignments = await assignmentRepo.find({
      where: {
        applicationId,
        level: AssignmentLevel.HOD_TO_APPLICANT,
        status: AssignmentStatus.REJECTED,
      },
    });

    if (assignments.length === 0) {
      return; // No assignments found, cannot verify completion
    }

    // Get all assignment sections for these assignments
    const assignmentSections = await assignmentSectionRepo.find({
      where: {
        assignmentId: In(assignments.map((a) => a.id)),
      },
    });

    // Get all unique unlocked sections from rejections
    const allUnlockedSections = application.rejections
      .flatMap((rejection) => rejection.unlockedSections || [])
      .filter((section, index, self) => self.indexOf(section) === index); // unique

    if (allUnlockedSections.length === 0) {
      return;
    }

    // Check if all unlocked sections have been resubmitted
    const sectionCompletionChecks = await Promise.all(
      allUnlockedSections.map(async (unlockedSection) => {
        // Find the normalized section type for this unlocked section
        let normalizedType: string | null = null;
        for (const [normalized, displayNames] of Object.entries(sectionTypeMap)) {
          if (displayNames.some((displayName) => unlockedSection.includes(displayName) || displayName.includes(unlockedSection))) {
            normalizedType = normalized;
            break;
          }
        }

        // If no mapping found, try to match directly
        if (!normalizedType) {
          normalizedType = unlockedSection.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
        }

        // Get all assignment sections for this section type
        const sectionsForType = assignmentSections.filter((section) => {
          // Match normalized type or check if sectionType contains the normalized type
          return section.sectionType === normalizedType ||
            section.sectionType.includes(normalizedType!) ||
            normalizedType!.includes(section.sectionType);
        });

        if (sectionsForType.length === 0) {
          // No specific resources to check, verify if any resubmission exists for this section type
          const resubmissions = await resubmittedSectionRepo.find({
            where: {
              applicationId,
              sectionType: normalizedType!,
            },
          });
          return resubmissions.length > 0;
        }

        // For sections with multiple resources, check if all resourceIds have been resubmitted
        const resourceIds = sectionsForType
          .map((section) => section.resourceId)
          .filter((id): id is string => id !== null && id !== undefined);

        if (resourceIds.length === 0) {
          // No resourceIds, check if any resubmission exists for this section type
          const resubmissions = await resubmittedSectionRepo.find({
            where: {
              applicationId,
              sectionType: normalizedType!,
            },
          });
          return resubmissions.length > 0;
        }

        // Check if all resourceIds have been resubmitted
        const resubmittedResourceIds = await resubmittedSectionRepo.find({
          where: {
            applicationId,
            sectionType: normalizedType!,
            resourceId: In(resourceIds),
          },
        });

        const resubmittedIds = new Set(resubmittedResourceIds.map((r) => r.resourceId).filter((id): id is string => id !== null && id !== undefined));

        // All resourceIds must be resubmitted
        return resourceIds.every((resourceId) => resubmittedIds.has(resourceId));
      })
    );

    const allSectionsComplete = sectionCompletionChecks.every((isComplete) => isComplete);

    // If all sections are complete, update application status to PENDING and move all assignments to history
    if (allSectionsComplete) {
      application.status = WarehouseOperatorApplicationStatus.PENDING;

      // Move all completed assignment sections to history (only assignments related to rejected sections)
      // This also returns the list of resubmitted section types and resourceIds
      const { resubmittedSections, resubmittedResourcesBySection } = await this.moveAllCompletedAssignmentSectionsToHistory(applicationId, application.rejections, repo);

      // Mark as resubmitted in metadata with the list of resubmitted sections and resourceIds
      application.metadata = {
        ...(application.metadata || {}),
        isResubmitted: true,
        resubmittedAt: new Date().toISOString(),
        resubmittedSections: resubmittedSections,
        resubmittedResourcesBySection: resubmittedResourcesBySection,
      };
      await applicationRepo.save(application);

      // Move all application rejections to history (all rejections from current cycle)
      await this.moveApplicationRejectionsToHistory(applicationId, repo);
    }
  }

  /**
   * Moves all completed assignment sections to history when all sections are resubmitted.
   * This allows users to resubmit sections multiple times until all sections are complete.
   * Only moves assignments that are related to rejected sections.
   * 
   * @param applicationId - The application ID
   * @param rejections - Array of application rejections to determine which sections were rejected
   * @param manager - EntityManager for database operations
   * @returns Object containing array of display names for resubmitted sections and resourceIds by section
   */
  private async moveAllCompletedAssignmentSectionsToHistory(
    applicationId: string,
    rejections: ApplicationRejectionEntity[],
    manager: EntityManager,
  ): Promise<{ resubmittedSections: string[]; resubmittedResourcesBySection: Record<string, string[]> }> {
    const assignmentRepo = manager.getRepository(Assignment);
    const assignmentSectionRepo = manager.getRepository(AssignmentSection);
    const assignmentSectionHistoryRepo = manager.getRepository(AssignmentSectionHistory);
    const assignmentSectionFieldHistoryRepo = manager.getRepository(AssignmentSectionFieldHistory);
    const assignmentHistoryRepo = manager.getRepository(AssignmentHistory);

    // Get all rejected section types from all rejections
    const rejectedSectionTypes = rejections
      .flatMap((rejection) => rejection.unlockedSections || [])
      .filter((section, index, self) => self.indexOf(section) === index); // unique

    if (rejectedSectionTypes.length === 0) {
      return {
        resubmittedSections: [],
        resubmittedResourcesBySection: {},
      }; // No rejected sections, nothing to move
    }

    // Map normalized section types to display names used in unlockedSections
    const sectionTypeMap: Record<string, string[]> = {
      '1-authorize-signatory-information': ['1-authorize-signatory-information'],
      '2-company-information': ['2-company-information'],
      '3-bank-details': ['3-bank-details'],
      '4-hr-information': ['4-hr-information'],
      '5-financial-information': ['5-financial-information'],
      '6-application-checklist-questionnaire': ['6-application-checklist-questionnaire'],
    };

    // Section type to human-readable display name mapping
    const sectionDisplayNames: Record<string, string> = {
      '1-authorize-signatory-information': 'Authorized Signatory Information',
      '2-company-information': 'Company Information',
      '3-bank-details': 'Bank Details',
      '4-hr-information': 'HR Information',
      '5-financial-information': 'Financial Information',
      '6-application-checklist-questionnaire': 'Applicant Checklist',
    };

    // Normalize rejected section types to match assignment section types
    const normalizedRejectedTypes = new Set<string>();
    for (const rejectedSection of rejectedSectionTypes) {
      // Try to find normalized type from map
      let normalizedType: string | null = null;
      for (const [normalized, displayNames] of Object.entries(sectionTypeMap)) {
        if (displayNames.some((displayName) => rejectedSection.includes(displayName) || displayName.includes(rejectedSection))) {
          normalizedType = normalized;
          break;
        }
      }

      // If no mapping found, try to normalize directly
      if (!normalizedType) {
        normalizedType = rejectedSection.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      }

      if (normalizedType) {
        normalizedRejectedTypes.add(normalizedType);
      }
    }

    // Find all assignments for this application with HOD_TO_APPLICANT or OFFICER_TO_HOD level
    const assignments = await assignmentRepo.find({
      where: {
        applicationId,
        level: In([AssignmentLevel.HOD_TO_APPLICANT, AssignmentLevel.OFFICER_TO_HOD]),
      },
      relations: ['sections', 'sections.fields', 'parentAssignment'],
    });

    // Filter assignments to only include those that have sections matching rejected section types
    const assignmentsToMove = assignments.filter((assignment) => {
      if (!assignment.sections || assignment.sections.length === 0) {
        return false;
      }

      // Check if any section in this assignment matches a rejected section type
      return assignment.sections.some((section) => {
        // Check if sectionType matches any rejected type
        return normalizedRejectedTypes.has(section.sectionType) ||
          Array.from(normalizedRejectedTypes).some((rejectedType) =>
            section.sectionType.includes(rejectedType) || rejectedType.includes(section.sectionType)
          );
      });
    });

    // Collect unique section types and resourceIds from all assignments being moved
    const resubmittedSectionTypes = new Set<string>();
    const resubmittedResourcesBySection: Record<string, string[]> = {};

    for (const assignment of assignmentsToMove) {
      if (assignment.sections && assignment.sections.length > 0) {
        for (const section of assignment.sections) {
          // Check if this section matches a rejected type
          const matchesRejected = normalizedRejectedTypes.has(section.sectionType) ||
            Array.from(normalizedRejectedTypes).some((rejectedType) =>
              section.sectionType.includes(rejectedType) || rejectedType.includes(section.sectionType)
            );

          if (matchesRejected) {
            resubmittedSectionTypes.add(section.sectionType);

            // Store resourceId for granular tracking (especially for HR and Financial subsections)
            if (section.resourceId) {
              if (!resubmittedResourcesBySection[section.sectionType]) {
                resubmittedResourcesBySection[section.sectionType] = [];
              }
              if (!resubmittedResourcesBySection[section.sectionType].includes(section.resourceId)) {
                resubmittedResourcesBySection[section.sectionType].push(section.resourceId);
              }
            }
          }
        }
      }
    }

    // Map section types to display names
    const resubmittedSections = Array.from(resubmittedSectionTypes)
      .map((sectionType) => sectionDisplayNames[sectionType] || sectionType)
      .filter((name, index, self) => self.indexOf(name) === index); // unique

    for (const assignment of assignmentsToMove) {
      // Move all sections for this assignment to history
      if (assignment.sections && assignment.sections.length > 0) {
        for (const section of assignment.sections) {
          // Move assignment section fields to history
          if (section.fields && section.fields.length > 0) {
            for (const field of section.fields) {
              const fieldHistory = assignmentSectionFieldHistoryRepo.create({
                assignmentSectionFieldId: field.id,
                assignmentSectionId: section.id,
                fieldName: field.fieldName,
                remarks: field.remarks,
                status: field.status,
                isActive: false,
              });
              // Preserve original createdAt
              fieldHistory.createdAt = field.createdAt;
              await assignmentSectionFieldHistoryRepo.save(fieldHistory);
            }
          }

          // Move assignment section to history
          const sectionHistory = assignmentSectionHistoryRepo.create({
            assignmentSectionId: section.id,
            assignmentId: assignment.id,
            sectionType: section.sectionType,
            resourceId: section.resourceId,
            resourceType: section.resourceType,
            isActive: false,
          });
          // Preserve original createdAt
          sectionHistory.createdAt = section.createdAt;
          await assignmentSectionHistoryRepo.save(sectionHistory);
        }

        // Delete all sections (cascade will delete fields)
        await assignmentSectionRepo.remove(assignment.sections);
      }

      // Move assignment to history
      const assignmentHistory = assignmentHistoryRepo.create({
        assignmentId: assignment.id,
        parentAssignmentId: assignment.parentAssignment?.id || null,
        applicationId: assignment.applicationId,
        applicationLocationId: assignment.applicationLocationId,
        assignedBy: assignment.assignedBy,
        assignedTo: assignment.assignedTo,
        level: assignment.level,
        assessmentId: assignment.assessmentId,
        status: assignment.status,
        isActive: false,
      });
      // Preserve original createdAt
      assignmentHistory.createdAt = assignment.createdAt;
      await assignmentHistoryRepo.save(assignmentHistory);

      // Delete the assignment
      await assignmentRepo.remove(assignment);
    }

    return {
      resubmittedSections,
      resubmittedResourcesBySection,
    };
  }

  /**
   * Checks if an assignment has any remaining sections.
   * If the assignment is empty, moves it to history.
   * 
   * @param assignmentId - The ID of the assignment to check
   * @param manager - EntityManager for database operations
   */
  private async moveAssignmentToHistoryIfEmpty(
    assignmentId: string,
    manager: EntityManager,
  ): Promise<void> {
    const assignmentRepo = manager.getRepository(Assignment);
    const assignmentSectionRepo = manager.getRepository(AssignmentSection);
    const assignmentHistoryRepo = manager.getRepository(AssignmentHistory);

    // Check if assignment has any remaining sections
    const remainingSectionsCount = await assignmentSectionRepo.count({
      where: { assignmentId },
    });

    // If assignment still has sections, don't move it
    if (remainingSectionsCount > 0) {
      return;
    }

    // Load assignment with relations
    const assignment = await assignmentRepo.findOne({
      where: { id: assignmentId },
      relations: ['parentAssignment'],
    });

    if (!assignment) {
      return; // Assignment already moved or doesn't exist
    }

    // Only move HOD_TO_APPLICANT or OFFICER_TO_HOD assignments
    if (
      assignment.level !== AssignmentLevel.HOD_TO_APPLICANT &&
      assignment.level !== AssignmentLevel.OFFICER_TO_HOD
    ) {
      return;
    }

    // Move assignment to history
    const assignmentHistory = assignmentHistoryRepo.create({
      assignmentId: assignment.id,
      parentAssignmentId: assignment.parentAssignment?.id || null,
      applicationId: assignment.applicationId,
      applicationLocationId: assignment.applicationLocationId,
      assignedBy: assignment.assignedBy,
      assignedTo: assignment.assignedTo,
      level: assignment.level,
      assessmentId: assignment.assessmentId,
      status: assignment.status,
      isActive: false,
    });
    // Preserve original createdAt
    assignmentHistory.createdAt = assignment.createdAt;
    await assignmentHistoryRepo.save(assignmentHistory);

    // Delete the assignment
    await assignmentRepo.remove(assignment);
  }

  /**
   * Moves all application rejections to history when all sections are resubmitted.
   * This moves all rejections from the current rejection cycle to history for audit trail.
   * 
   * @param applicationId - The application ID
   * @param manager - EntityManager for database operations
   */
  private async moveApplicationRejectionsToHistory(
    applicationId: string,
    manager: EntityManager,
  ): Promise<void> {
    const rejectionRepo = manager.getRepository(ApplicationRejectionEntity);
    const rejectionHistoryRepo = manager.getRepository(ApplicationRejectionHistoryEntity);

    // Find all rejections for this application (all rejections from current cycle)
    const rejections = await rejectionRepo.find({
      where: { applicationId },
    });

    if (rejections.length === 0) {
      return; // No rejections to move
    }

    // Move each rejection to history
    for (const rejection of rejections) {
      const rejectionHistory = rejectionHistoryRepo.create({
        applicationId: rejection.applicationId,
        locationApplicationId: rejection.locationApplicationId,
        rejectionReason: rejection.rejectionReason,
        rejectionBy: rejection.rejectionBy,
        unlockedSections: rejection.unlockedSections,
      });

      // Preserve original createdAt timestamp
      rejectionHistory.createdAt = rejection.createdAt;

      await rejectionHistoryRepo.save(rejectionHistory);
    }

    // Delete all rejections from active table
    await rejectionRepo.remove(rejections);
  }
}
