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

    const savedHr = await this.dataSource.transaction(async (manager) => {
      const hrRepo = manager.getRepository(HrEntity);
      const personalRepo = manager.getRepository(PersonalDetailsEntity);
      const academicRepo = manager.getRepository(AcademicQualificationsEntity);
      const professionalRepo = manager.getRepository(ProfessionalQualificationsEntity);
      const trainingsRepo = manager.getRepository(TrainingsEntity);
      const experienceRepo = manager.getRepository(ExperienceEntity);
      const declarationRepo = manager.getRepository(DeclarationEntity);
      const designationRepo = manager.getRepository(Designation);

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
        });
        await personalRepo.save(existingHr.personalDetails);

        await academicRepo.delete({ hrId: existingHr.id });
        await professionalRepo.delete({ hrId: existingHr.id });
        await trainingsRepo.delete({ hrId: existingHr.id });
        await experienceRepo.delete({ hrId: existingHr.id });

        const academicEntities = await academicRepo.save(
          dto.academicQualifications.map((item) =>
            academicRepo.create({
              ...item,
              hrId: existingHr.id,
            }),
          ),
        );

        const professionalEntities = await professionalRepo.save(
          dto.professionalQualifications.map((item) =>
            professionalRepo.create({
              ...item,
              hrId: existingHr.id,
            }),
          ),
        );

        const trainingEntities = await trainingsRepo.save(
          dto.trainings.map((item) =>
            trainingsRepo.create({
              ...item,
              hrId: existingHr.id,
            }),
          ),
        );

        const experienceEntities = await experienceRepo.save(
          dto.experiences.map((item) =>
            experienceRepo.create({
              ...item,
              hrId: existingHr.id,
            }),
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
      });
      await personalRepo.save(personalDetails);

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
            hrId: hr.id,
          }),
        ),
      );

      const professionalEntities = await professionalRepo.save(
        dto.professionalQualifications.map((item) =>
          professionalRepo.create({
            ...item,
            hrId: hr.id,
          }),
        ),
      );

      const trainingEntities = await trainingsRepo.save(
        dto.trainings.map((item) =>
          trainingsRepo.create({
            ...item,
            hrId: hr.id,
          }),
        ),
      );

      const experienceEntities = await experienceRepo.save(
        dto.experiences.map((item) =>
          experienceRepo.create({
            ...item,
            hrId: hr.id,
          }),
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
        'academicQualifications',
        'professionalQualifications',
        'trainings',
        'experiences',
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

        // Delete existing tax returns, bank statements, and others
        await taxReturnRepo.delete({ financialInformationId: existingFinancialInfo.id });
        await bankStatementRepo.delete({ financialInformationId: existingFinancialInfo.id });
        await othersRepo.delete({ financialInformationId: existingFinancialInfo.id });

        // Create new tax returns
        const taxReturnEntities = await taxReturnRepo.save(
          dto.taxReturns.map((item) =>
            taxReturnRepo.create({
              ...item,
              financialInformationId: existingFinancialInfo.id,
            }),
          ),
        );

        // Create new bank statements
        const bankStatementEntities = await bankStatementRepo.save(
          dto.bankStatements.map((item) =>
            bankStatementRepo.create({
              ...item,
              financialInformationId: existingFinancialInfo.id,
            }),
          ),
        );

        // Create new others
        const othersEntities = await othersRepo.save(
          dto.others.map((item) =>
            othersRepo.create({
              ...item,
              financialInformationId: existingFinancialInfo.id,
            }),
          ),
        );

        existingFinancialInfo.taxReturns = taxReturnEntities;
        existingFinancialInfo.bankStatements = bankStatementEntities;
        existingFinancialInfo.others = othersEntities;

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

      // Create tax returns
      const taxReturnEntities = await taxReturnRepo.save(
        dto.taxReturns.map((item) =>
          taxReturnRepo.create({
            ...item,
            financialInformationId: financialInfo.id,
          }),
        ),
      );

      // Create bank statements
      const bankStatementEntities = await bankStatementRepo.save(
        dto.bankStatements.map((item) =>
          bankStatementRepo.create({
            ...item,
            financialInformationId: financialInfo.id,
          }),
        ),
      );

      // Create others
      const othersEntities = await othersRepo.save(
        dto.others.map((item) =>
          othersRepo.create({
            ...item,
            financialInformationId: financialInfo.id,
          }),
        ),
      );

      financialInfo.taxReturns = taxReturnEntities;
      financialInfo.bankStatements = bankStatementEntities;
      financialInfo.others = othersEntities;

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

    // Validate file size (max 100MB)
    const maxSizeBytes = 100 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 100MB`,
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
    if (application.status === WarehouseOperatorApplicationStatus.DRAFT) {
      throw new BadRequestException('Cannot Add new Bank Details. Bank Details can only be updated.');
    }

    if (
      ![WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED]
        .includes(application.status)
    ) {
      throw new BadRequestException('Cannot update bank details after application is submitted');
    }

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

    if(![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(application.status)) {
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

  async findOneWarehouseOperator(userId: string) {
    const warehouseOperatorApplication = await this.warehouseOperatorRepository.findOne({
      where: {
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
            dateOfBirth: hr.personalDetails.dateOfBirth
              ? hr.personalDetails.dateOfBirth.toISOString().split('T')[0]
              : null,
            residentialAddress: hr.personalDetails.residentialAddress,
            businessAddress: hr.personalDetails.businessAddress ?? null,
            telephone: hr.personalDetails.telephone ?? null,
            mobileNumber: hr.personalDetails.mobileNumber,
            email: hr.personalDetails.email,
            nationalTaxNumber: hr.personalDetails.nationalTaxNumber ?? null,
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
      })) ?? [],
      professionalQualifications: hr.professionalQualifications?.map((item) => ({
        id: item.id,
        certificationTitle: item.certificationTitle,
        issuingBody: item.issuingBody,
        country: item.country,
        dateOfAward: item.dateOfAward,
        validity: item.validity ?? null,
        membershipNumber: item.membershipNumber ?? null,
      })) ?? [],
      trainings: hr.trainings?.map((item) => ({
        id: item.id,
        trainingTitle: item.trainingTitle,
        conductedBy: item.conductedBy,
        trainingType: item.trainingType,
        durationStart: item.durationStart,
        durationEnd: item.durationEnd,
        dateOfCompletion: item.dateOfCompletion,
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
      taxReturns: financialInfo.taxReturns?.map((item) => ({
        id: item.id,
        documentType: item.documentType,
        documentName: item.documentName,
        periodStart: item.periodStart,
        periodEnd: item.periodEnd,
        remarks: item.remarks ?? null,
      })) ?? [],
      bankStatements: financialInfo.bankStatements?.map((item) => ({
        id: item.id,
        documentType: item.documentType,
        documentName: item.documentName,
        periodStart: item.periodStart,
        periodEnd: item.periodEnd,
        remarks: item.remarks ?? null,
      })) ?? [],
      others: financialInfo.others?.map((item) => ({
        id: item.id,
        documentType: item.documentType,
        documentName: item.documentName,
        periodStart: item.periodStart,
        periodEnd: item.periodEnd,
        remarks: item.remarks ?? null,
      })) ?? [],
    };
  }
}
