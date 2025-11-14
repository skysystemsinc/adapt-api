import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizedSignatoryDto, CreateCompanyInformationRequestDto, CreateBankDetailsDto, CreateWarehouseOperatorApplicationRequestDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { DataSource, Repository } from 'typeorm';
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
import { UpsertHrInformationDto } from './dto/create-hr-information.dto';
import { Designation } from '../common/entities/designation.entity';
import { AccountType, UpdateBankDetailsDto } from './dto/create-bank-details.dto';
import { FinancialInformationEntity } from './entities/financial-information.entity';
import { AuditReportEntity } from './entities/financial/audit-report.entity';
import { TaxReturnEntity } from './entities/financial/tax-return.entity';
import { BankStatementEntity } from './entities/financial/bank-statement.entity';
import { OthersEntity } from './entities/financial/others.entity';
import { CreateFinancialInformationDto } from './dto/create-financial-information.dto';
import { CreateApplicantChecklistDto } from './dto/create-applicant-checklist.dto';
import { ApplicantChecklistEntity } from './entities/applicant-checklist.entity';
import { FinancialSoundnessChecklistEntity } from './entities/checklist/financial-soundness.entity';
import { DeclarationChecklistEntity } from './entities/checklist/declaration.entity';
import { HumanResourcesChecklistEntity } from './entities/checklist/human-resources.entity';
import { RegistrationFeeChecklistEntity } from './entities/checklist/registration-fee.entity';
import { ListWarehouseOperatorApplicationDto } from './dto/list-warehouse.dto';
import { CreateAuthorizedSignatoryDto } from './dto/create-authorized-signatory.dto';

@Injectable()
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
    query.orderBy(`warehouseOperatorApplication.${sortBy}`, sortOrder);
    query.skip(((page ?? 1) - 1) * (limit ?? 10));
    query.take(limit ?? 10);
    const [applications, total] = await query.getManyAndCount();
    return {
      applications,
      total,
      page: page ?? 1,
      limit: limit ?? 10,
      sortBy: sortBy ?? 'createdAt',
      sortOrder: sortOrder ?? 'DESC',
    };
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

    const newApplication = this.warehouseOperatorRepository.create({
      applicationId: await this.generateApplicationId(),
      userId,
      status: WarehouseOperatorApplicationStatus.DRAFT
    });

    const warehouseOperatorApplication = await this.warehouseOperatorRepository.save(newApplication);

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

  async updateAuthorizedSignatory(
    authorizedSignatoryId: string,
    updateAuthorizedSignatoryDto: CreateAuthorizedSignatoryDto,
    userId: string
  ) {
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
      throw new BadRequestException('Cannot update authorized signatory after application is approved or submitted');
    }

    authorizedSignatory.authorizedSignatoryName = updateAuthorizedSignatoryDto.authorizedSignatoryName;
    authorizedSignatory.name = updateAuthorizedSignatoryDto.name;
    authorizedSignatory.cnic = updateAuthorizedSignatoryDto.cnic.toString();
    authorizedSignatory.passport = updateAuthorizedSignatoryDto.passport ?? authorizedSignatory.passport;
    authorizedSignatory.issuanceDateOfCnic = updateAuthorizedSignatoryDto.issuanceDateOfCnic;
    authorizedSignatory.expiryDateOfCnic = updateAuthorizedSignatoryDto.expiryDateOfCnic;
    authorizedSignatory.mailingAddress = updateAuthorizedSignatoryDto.mailingAddress;
    authorizedSignatory.city = updateAuthorizedSignatoryDto.city;
    authorizedSignatory.country = updateAuthorizedSignatoryDto.country;
    authorizedSignatory.postalCode = updateAuthorizedSignatoryDto.postalCode;
    authorizedSignatory.designation = updateAuthorizedSignatoryDto.designation;
    authorizedSignatory.mobileNumber = updateAuthorizedSignatoryDto.mobileNumber;
    authorizedSignatory.email = updateAuthorizedSignatoryDto.email;
    authorizedSignatory.landlineNumber = updateAuthorizedSignatoryDto.landlineNumber || '';

    const updated = await this.authorizedSignatoryRepository.save(authorizedSignatory);

    return {
      message: 'Authorized signatory updated successfully',
      authorizedSignatoryId: updated.id,
      applicationId: application.applicationId,
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

    if (application.status !== WarehouseOperatorApplicationStatus.DRAFT) {
      throw new BadRequestException('Financial information can only be added while application is in draft status.');
    }

    // Check if financial information already exists for this application (only when creating new, not updating)
    if (!dto.id) {
      const existingFinancialInfo = await this.financialInformationRepository.findOne({
        where: { applicationId: application.id }
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
          Object.assign(existingFinancialInfo.auditReport, dto.auditReport);
          await auditReportRepo.save(existingFinancialInfo.auditReport);
        } else {
          const newAuditReport = await auditReportRepo.save(
            auditReportRepo.create({
              ...dto.auditReport,
              financialInformationId: existingFinancialInfo.id,
            }),
          );
          existingFinancialInfo.auditReport = newAuditReport;
          existingFinancialInfo.auditReportId = newAuditReport.id;
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

    return {
      message: 'Financial information saved successfully',
      data: this.mapFinancialInformationEntityToResponse(hydratedFinancialInfo!),
    };
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
  ) {
    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    if (application.status !== WarehouseOperatorApplicationStatus.DRAFT) {
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
        humanResources: manager.getRepository(HumanResourcesChecklistEntity),
        financialSoundness: manager.getRepository(FinancialSoundnessChecklistEntity),
        registrationFee: manager.getRepository(RegistrationFeeChecklistEntity),
        declaration: manager.getRepository(DeclarationChecklistEntity),
        document: manager.getRepository(WarehouseDocument),
      };

      const assignDocument = this.createAssignDocumentFunction(repos.document, userId);
      const assignDocuments = this.createBatchAssignDocumentsFunction(assignDocument);

      if (dto.id) {
        return await this.updateApplicantChecklist(
          dto,
          application,
          repos,
          assignDocuments,
        );
      }

      return await this.createNewApplicantChecklist(
        dto,
        application,
        repos,
        assignDocuments,
      );
    });

    application.status = WarehouseOperatorApplicationStatus.PENDING;
    await this.warehouseOperatorRepository.save(application);

    const hydratedApplicantChecklist = await this.applicantChecklistRepository.findOne({
      where: { id: savedApplicantChecklist.id },
      relations: ['humanResources', 'financialSoundness', 'registrationFee', 'declaration'],
    });

    return {
      message: 'Applicant checklist saved successfully',
      data: this.mapApplicantChecklistEntityToResponse(hydratedApplicantChecklist!),
    };
  }

  /**
   * Create assign document function for transaction
   */
  private createAssignDocumentFunction(documentRepo: Repository<WarehouseDocument>, userId: string) {
    return async (
      documentId: string | undefined | null,
      documentableType: string,
      documentType: string,
      documentableId: string,
    ) => {
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
      documents: Array<{ id: string | undefined | null; type: string; documentType: string; entityId: string }>,
    ) => {
      await Promise.all(
        documents.map((doc) => assignDocument(doc.id, doc.type, doc.documentType, doc.entityId)),
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

    // Update or create Human Resources
    let hrEntity: HumanResourcesChecklistEntity;
    if (existingApplicantChecklist.humanResources) {
      hrEntity = await this.updateHumanResources(existingApplicantChecklist.humanResources, dto.humanResources, repos.humanResources);
    } else {
      hrEntity = await this.createHumanResources(dto.humanResources, existingApplicantChecklist, repos.humanResources);
      existingApplicantChecklist.humanResources = hrEntity;
      existingApplicantChecklist.humanResourcesId = hrEntity.id;
    }

    await assignDocuments([
      {
        id: hrEntity.qcPersonnelFile ?? dto.humanResources.qcPersonnelFile ?? null,
        type: 'HumanResourcesChecklist',
        documentType: 'qcPersonnelFile',
        entityId: hrEntity.id,
      },
      {
        id: hrEntity.warehouseSupervisorFile ?? dto.humanResources.warehouseSupervisorFile ?? null,
        type: 'HumanResourcesChecklist',
        documentType: 'warehouseSupervisorFile',
        entityId: hrEntity.id,
      },
      {
        id: hrEntity.dataEntryOperatorFile ?? dto.humanResources.dataEntryOperatorFile ?? null,
        type: 'HumanResourcesChecklist',
        documentType: 'dataEntryOperatorFile',
        entityId: hrEntity.id,
      },
    ]);

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

    await assignDocuments([
      {
        id: fsEntity.auditedFinancialStatementsFile ?? dto.financialSoundness.auditedFinancialStatementsFile ?? null,
        type: 'FinancialSoundnessChecklist',
        documentType: 'auditedFinancialStatementsFile',
        entityId: fsEntity.id,
      },
      {
        id: fsEntity.positiveNetWorthFile ?? dto.financialSoundness.positiveNetWorthFile ?? null,
        type: 'FinancialSoundnessChecklist',
        documentType: 'positiveNetWorthFile',
        entityId: fsEntity.id,
      },
      {
        id: fsEntity.noLoanDefaultsFile ?? dto.financialSoundness.noLoanDefaultsFile ?? null,
        type: 'FinancialSoundnessChecklist',
        documentType: 'noLoanDefaultsFile',
        entityId: fsEntity.id,
      },
      {
        id: fsEntity.cleanCreditHistoryFile ?? dto.financialSoundness.cleanCreditHistoryFile ?? null,
        type: 'FinancialSoundnessChecklist',
        documentType: 'cleanCreditHistoryFile',
        entityId: fsEntity.id,
      },
      {
        id: fsEntity.adequateWorkingCapitalFile ?? dto.financialSoundness.adequateWorkingCapitalFile ?? null,
        type: 'FinancialSoundnessChecklist',
        documentType: 'adequateWorkingCapitalFile',
        entityId: fsEntity.id,
      },
      {
        id: fsEntity.validInsuranceCoverageFile ?? dto.financialSoundness.validInsuranceCoverageFile ?? null,
        type: 'FinancialSoundnessChecklist',
        documentType: 'validInsuranceCoverageFile',
        entityId: fsEntity.id,
      },
      {
        id: fsEntity.noFinancialFraudFile ?? dto.financialSoundness.noFinancialFraudFile ?? null,
        type: 'FinancialSoundnessChecklist',
        documentType: 'noFinancialFraudFile',
        entityId: fsEntity.id,
      },
    ]);

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

    await assignDocuments([
      {
        id: rfEntity.bankPaymentSlip ?? dto.registrationFee.bankPaymentSlip ?? null,
        type: 'RegistrationFeeChecklist',
        documentType: 'bankPaymentSlip',
        entityId: rfEntity.id,
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
      qcPersonnelFile: dto.qcPersonnelFile ?? existing.qcPersonnelFile,
      warehouseSupervisorFile: dto.warehouseSupervisorFile ?? existing.warehouseSupervisorFile,
      dataEntryOperatorFile: dto.dataEntryOperatorFile ?? existing.dataEntryOperatorFile,
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
      auditedFinancialStatementsFile: dto.auditedFinancialStatementsFile ?? existing.auditedFinancialStatementsFile,
      positiveNetWorthFile: dto.positiveNetWorthFile ?? existing.positiveNetWorthFile,
      noLoanDefaultsFile: dto.noLoanDefaultsFile ?? existing.noLoanDefaultsFile,
      cleanCreditHistoryFile: dto.cleanCreditHistoryFile ?? existing.cleanCreditHistoryFile,
      adequateWorkingCapitalFile: dto.adequateWorkingCapitalFile ?? existing.adequateWorkingCapitalFile,
      validInsuranceCoverageFile: dto.validInsuranceCoverageFile ?? existing.validInsuranceCoverageFile,
      noFinancialFraudFile: dto.noFinancialFraudFile ?? existing.noFinancialFraudFile,
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
      name: createBankDetailsDto.accountTitle,
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

  async updateBankDetails(
    applicationId: string,
    bankDetailsId: string,
    updateBankDetailsDto: UpdateBankDetailsDto,
    userId: string
  ) {
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

    bankDetails.name = updateBankDetailsDto.name;
    bankDetails.accountTitle = updateBankDetailsDto.accountTitle;
    bankDetails.iban = updateBankDetailsDto.iban;
    bankDetails.accountType = updateBankDetailsDto.accountType as AccountType;
    bankDetails.branchAddress = updateBankDetailsDto.branchAddress || '';

    const updatedBankDetails = await this.bankDetailsRepository.save(bankDetails);

    return {
      message: 'Bank details updated successfully',
      bankDetails: updatedBankDetails,
    };
  }

  async findByUserId(userId: string) {
    return await this.warehouseOperatorRepository.find({ where: { userId } });
  }

  async generateApplicationId() {
    const count = await this.warehouseOperatorRepository.count();
    const applicationId = `WHO-${String(count + 1).padStart(6, '0')}`;
    return applicationId;
  }

  async findOneWarehouseOperator(id: string, userId: string) {
    const warehouseOperatorApplication = await this.warehouseOperatorRepository.findOne({
      where: {
        id,
        userId
      },
      relations: ['authorizedSignatories' as 'Authorized Signatory']
    });

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
          photograph: hr.personalDetails.photograph ?? null,
          photographDocumentName: hr.personalDetails.photographDocument?.originalFileName ?? null,
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
        academicCertificate: item.academicCertificate ?? null,
        academicCertificateDocumentName: item.academicCertificateDocument?.originalFileName ?? null,
      })) ?? [],
      professionalQualifications: hr.professionalQualifications?.map((item) => ({
        id: item.id,
        certificationTitle: item.certificationTitle,
        issuingBody: item.issuingBody,
        country: item.country,
        dateOfAward: item.dateOfAward,
        validity: item.validity ?? null,
        membershipNumber: item.membershipNumber ?? null,
        professionalCertificate: item.professionalCertificate ?? null,
        professionalCertificateDocumentName: item.professionalCertificateDocument?.originalFileName ?? null,
      })) ?? [],
      trainings: hr.trainings?.map((item) => ({
        id: item.id,
        trainingTitle: item.trainingTitle,
        conductedBy: item.conductedBy,
        trainingType: item.trainingType,
        durationStart: item.durationStart,
        durationEnd: item.durationEnd,
        dateOfCompletion: item.dateOfCompletion,
        trainingCertificate: item.trainingCertificate ?? null,
        trainingCertificateDocumentName: item.trainingCertificateDocument?.originalFileName ?? null,
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
        experienceLetter: item.experienceLetter ?? null,
        experienceLetterDocumentName: item.experienceLetterDocument?.originalFileName ?? null,
      })) ?? [],
      declaration: hr.declaration
        ? {
          writeOffAvailed: hr.declaration.writeOffAvailed,
          defaultOfFinance: hr.declaration.defaultOfFinance,
          placementOnECL: hr.declaration.placementOnECL,
          convictionPleaBargain: hr.declaration.convictionPleaBargain,
        }
        : null,
    };
  }

  private mapFinancialInformationEntityToResponse(financialInfo: FinancialInformationEntity) {
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
        }
        : null,
      other: financialInfo.others?.[0]
        ? {
           id: financialInfo.others[0].id,
           documentType: financialInfo.others[0].documentType,
           documentName: financialInfo.others[0].documentName,
           periodStart: financialInfo.others[0].periodStart,
           periodEnd: financialInfo.others[0].periodEnd,
           remarks: financialInfo.others[0].remarks ?? null,
         }
        : null,
    };
  }

  private mapApplicantChecklistEntityToResponse(checklist: ApplicantChecklistEntity) {
    return {
      id: checklist.id,
      humanResources: checklist.humanResources
        ? {
            id: checklist.humanResources.id,
            qcPersonnel: checklist.humanResources.qcPersonnel,
            qcPersonnelFile: checklist.humanResources.qcPersonnelFile ?? null,
            warehouseSupervisor: checklist.humanResources.warehouseSupervisor,
            warehouseSupervisorFile: checklist.humanResources.warehouseSupervisorFile ?? null,
            dataEntryOperator: checklist.humanResources.dataEntryOperator,
            dataEntryOperatorFile: checklist.humanResources.dataEntryOperatorFile ?? null,
          }
        : null,
      financialSoundness: checklist.financialSoundness
        ? {
            id: checklist.financialSoundness.id,
            auditedFinancialStatements: checklist.financialSoundness.auditedFinancialStatements,
            auditedFinancialStatementsFile: checklist.financialSoundness.auditedFinancialStatementsFile ?? null,
            positiveNetWorth: checklist.financialSoundness.positiveNetWorth,
            positiveNetWorthFile: checklist.financialSoundness.positiveNetWorthFile ?? null,
            noLoanDefaults: checklist.financialSoundness.noLoanDefaults,
            noLoanDefaultsFile: checklist.financialSoundness.noLoanDefaultsFile ?? null,
            cleanCreditHistory: checklist.financialSoundness.cleanCreditHistory,
            cleanCreditHistoryFile: checklist.financialSoundness.cleanCreditHistoryFile ?? null,
            adequateWorkingCapital: checklist.financialSoundness.adequateWorkingCapital,
            adequateWorkingCapitalFile: checklist.financialSoundness.adequateWorkingCapitalFile ?? null,
            validInsuranceCoverage: checklist.financialSoundness.validInsuranceCoverage,
            validInsuranceCoverageFile: checklist.financialSoundness.validInsuranceCoverageFile ?? null,
            noFinancialFraud: checklist.financialSoundness.noFinancialFraud,
            noFinancialFraudFile: checklist.financialSoundness.noFinancialFraudFile ?? null,
          }
        : null,
      registrationFee: checklist.registrationFee
        ? {
            id: checklist.registrationFee.id,
            bankPaymentSlip: checklist.registrationFee.bankPaymentSlip ?? null,
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
}
