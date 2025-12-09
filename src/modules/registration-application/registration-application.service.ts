import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { plainToInstance, instanceToPlain } from 'class-transformer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { RegistrationApplication, ApplicationStatus } from './entities/registration-application.entity';
import { RegistrationApplicationDetails, DetailStatus } from './entities/registration-application-details.entity';
import { AdminRegistrationDocument } from './entities/admin-registration-document.entity';
import { CreateRegistrationApplicationDto } from './dto/create-registration-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { UpdateDetailStatusDto } from './dto/update-detail-status.dto';
import { QueryRegistrationApplicationDto } from './dto/query-registration-application.dto';
import { SubmitRegistrationDto } from './dto/submit-registration.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';
import { UploadAdminDocumentResponseDto } from './dto/upload-admin-document.dto';
import { ApplicationType } from '../application-type/entities/application-type.entity';
import { calculateDaysCount, calculateBusinessDays, isApplicationOverdue } from '../../common/utils/date.utils';
import { UsersService } from '../users/users.service';
import { Role } from '../rbac/entities/role.entity';
import { FormField } from '../forms/entities/form-field.entity';
import { encryptBuffer, decryptBuffer } from 'src/common/utils/helper.utils';

@Injectable()
export class RegistrationApplicationService {
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(RegistrationApplication)
    private registrationApplicationRepository: Repository<RegistrationApplication>,
    @InjectRepository(RegistrationApplicationDetails)
    private registrationApplicationDetailsRepository: Repository<RegistrationApplicationDetails>,
    @InjectRepository(AdminRegistrationDocument)
    private adminRegistrationDocumentRepository: Repository<AdminRegistrationDocument>,
    @InjectRepository(ApplicationType)
    private applicationTypeRepository: Repository<ApplicationType>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(FormField)
    private formFieldRepository: Repository<FormField>,
    private usersService: UsersService,
  ) {
    this.ensureUploadDirectory();
  }

  private async getFirstPendingApplicationId(): Promise<string | null> {
    const firstPending = await this.registrationApplicationRepository.findOne({
      where: { status: ApplicationStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
    return firstPending?.id || null;
  }

  private enrichApplicationWithCalculatedFields(
    application: RegistrationApplication,
    firstPendingId: string | null,
  ) {
    const plainApp = instanceToPlain(application);
    
    let isViewable = false;
    if (application.status !== ApplicationStatus.PENDING) {
      isViewable = true;
    } else {
      isViewable = application.id === firstPendingId;
    }
    
    return {
      ...plainApp,
      daysCount: calculateDaysCount(application.createdAt),
      businessDays: calculateBusinessDays(application.createdAt),
      isOverdue: isApplicationOverdue(application.createdAt, application.status),
      isViewable,
    };
  }

  async submitRegistration(
    dto: SubmitRegistrationDto,
    ipAddress: string,
    userAgent: string,
    referrer?: string,
  ): Promise<RegistrationResponseDto> {
    return await this.registrationApplicationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 1. Find application type by slug (optional)
        let applicationType: ApplicationType | null = null;
        if (dto.applicationTypeSlug) {
          applicationType = await transactionalEntityManager.findOne(ApplicationType, {
            where: { slug: dto.applicationTypeSlug },
          });
          // Don't throw error if not found - just set to null
        }

        // 2. Create registration application
        const application = transactionalEntityManager.create(RegistrationApplication, {
          formId: dto.formId,
          applicationTypeId: applicationType,
          status: ApplicationStatus.PENDING,
          ipAddress,
          userAgent,
          referrer,
          metadata: dto.metadata || {},
        });

        const savedApplication = await transactionalEntityManager.save(application);

        // 3. Fetch form fields to get documentTypeId
        const formFields = await transactionalEntityManager.find(FormField, {
          where: { formId: dto.formId },
        });

        // Create a map of fieldKey to documentTypeId
        const fieldKeyToDocTypeId = new Map<string, string | null>();
        formFields.forEach((field) => {
          fieldKeyToDocTypeId.set(field.fieldKey, field.documentTypeId);
        });

        // 4. Create details records with documentTypeId copied from form fields
        const details = dto.values.map((fieldValue) =>
          transactionalEntityManager.create(RegistrationApplicationDetails, {
            application: savedApplication,
            key: fieldValue.fieldKey,
            value: typeof fieldValue.value === 'object' 
              ? JSON.stringify(fieldValue.value) 
              : String(fieldValue.value),
            label: fieldValue.label || null,
            documentTypeId: fieldKeyToDocTypeId.get(fieldValue.fieldKey) || null,
            status: DetailStatus.PENDING,
          }),
        );

        if (details.length > 0) {
          await transactionalEntityManager.save(details);
        }

        // 4. Fetch complete application with details
        const completeApplication = await transactionalEntityManager.findOne(
          RegistrationApplication,
          {
            where: { id: savedApplication.id },
            relations: ['details', 'applicationTypeId'],
          },
        );

        return plainToInstance(RegistrationResponseDto, completeApplication, {
          excludeExtraneousValues: true,
        });
      },
    );
  }

  findAll() {
    return this.registrationApplicationRepository.find({
      relations: ['details', 'applicationTypeId'],
    });
  }

  async findAllPaginated(query: QueryRegistrationApplicationDto) {
    const { page = 1, limit = 10, status, applicationTypeId, search, sortBy = 'createdAt', sortOrder = 'ASC' } = query;

    const queryBuilder = this.registrationApplicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.applicationTypeId', 'applicationType')
      .leftJoinAndSelect('application.details', 'details');

    // Filter by status
    if (status) {
      queryBuilder.andWhere('application.status = :status', { status });
    }

    // Filter by application type
    if (applicationTypeId) {
      queryBuilder.andWhere('application.applicationTypeIdId = :applicationTypeId', { applicationTypeId });
    }

    // Search in details (applicant name, email, etc.)
    if (search) {
      queryBuilder.andWhere(
        '(details.value LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Sorting
    queryBuilder.orderBy(`application.${sortBy}`, sortOrder);
    // Also order details by createdAt to maintain consistent order
    queryBuilder.addOrderBy('details.createdAt', 'ASC');

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    const firstPendingId = await this.getFirstPendingApplicationId();
    const enrichedData = data.map((app) => 
      this.enrichApplicationWithCalculatedFields(app, firstPendingId)
    );

    return {
      data: enrichedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const application = await this.registrationApplicationRepository.findOne({ 
      where: { id },
      relations: ['details', 'applicationTypeId'],
    });

    if (!application) {
      return null;
    }

    // Security: Block direct URL access to non-viewable pending applications
    if (application.status === ApplicationStatus.PENDING) {
      const firstPendingId = await this.getFirstPendingApplicationId();
      if (application.id !== firstPendingId) {
        throw new ForbiddenException('This application is not available for review yet. Please review applications in order.');
      }
    }

    // Sort details by createdAt to maintain consistent order
    if (application.details) {
      application.details.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    return application;
  }

  async create(data: CreateRegistrationApplicationDto, metadata?: { ipAddress?: string; userAgent?: string; referrer?: string }) {
    // Create the main application record with metadata
    const applicationType = await this.applicationTypeRepository.findOne({ where: { id: data.applicationTypeId } });
    if (!applicationType) {
      throw new NotFoundException('Invalid application type');
    }

    const application = this.registrationApplicationRepository.create({
      applicationTypeId: applicationType,
      status: ApplicationStatus.PENDING,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      referrer: metadata?.referrer,
    });
    
    const savedApplication = await this.registrationApplicationRepository.save(application);
    
    data.formData.applicateType = applicationType.name;
    // Transform formData object into detail records
    if (data.formData && Object.keys(data.formData).length > 0) {
      const details = Object.entries(data.formData).map(([key, value]) => {
        return this.registrationApplicationDetailsRepository.create({
          application: savedApplication,
          key,
          value: String(value),
          status: DetailStatus.PENDING,
        });
      });
      
      await this.registrationApplicationDetailsRepository.save(details);
    }
    
    // Return the application with its details
    return this.findOne(savedApplication.id);
  }

  async update(id: string, data: Partial<RegistrationApplication>) {
    await this.registrationApplicationRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.registrationApplicationRepository.delete(id);
    return { deleted: true };
  }

  /**
   * Get registration application details by userId
   * Flow:
   * 1. Get userId from token (passed as parameter)
   * 2. Find registration_application by userId (through user relation)
   * 3. Get formId from registration_application
   * 4. Find form_fields with specific labels and get their field keys
   * 5. Find registration_application_details using those field keys and applicationId
   * 6. Return the values with readable property names
   */
  async getRegistrationApplicationDetailsByUserId(userId: string): Promise<{
    details: Record<string, string>;
  }> {
    try {
      // Step 1: Find registration_application by userId through user relation
      // Using QueryBuilder since userId is the actual column name (from JoinColumn)
      const application = await this.registrationApplicationRepository
        .createQueryBuilder('application')
        .leftJoinAndSelect('application.applicationTypeId', 'applicationTypeId')
        .leftJoinAndSelect('application.user', 'user')
        .where('application.userId = :userId', { userId })
        .getOne();

      if (!application) {
        return { details: {} };
      }

      // Step 2: Get formId from registration_application
      const formId = application.formId;
      if (!formId) {
        return { details: {} };
      }

      // Step 3: Find form_fields with specific labels and get their field keys
      // Mapping from labels to readable property names
      const labelToPropertyMap: Record<string, string> = {
        "Please select your application types:": "applicationType",
        "Please select your application type:": "applicationType",
        "CNIC Number": "cnicNumber",
        "Name of Applicant as per CNIC": "nameAsPerCNIC",
        "Business / Applicant Name (as per CNIC)": "nameAsPerCNIC",
        "Business Name of Partnership (as per registration)": "nameAsPerCNIC",
        "Company Name (as per SECP Registration)": "nameAsPerCNIC",
        "testign123": "nameAsPerCNIC",
        "Business / Company Name": "nameAsPerCNIC",
        "Date of Issuance of CNIC of Applicant Authrotrized Signatory": "cnicIssuanceDate",
        "Registered Mobile No. of Applicant Authorized Signatory": "mobileNumber",
        "Valid Email ID of Applicant Authorized Signatory": "email",
        "Active Filer Status of the Applicant": "activeFilerStatus",
        "Applicant Official Bank Account / IBAN": "ibanNumber",
        "Official Bank Account Number / IBAN": "ibanNumber",
        "Official Bank Account Number / IBAN (in name of Firm)": "ibanNumber",
        "Official Bank Account Number / IBAN (in name of Company)": "ibanNumber",
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
      const applicationId = application.id;
      const details: Record<string, string> = {};

      // Add applicationType from the applicationTypeId relation if it exists
      if (application.applicationTypeId?.name) {
        details['applicationType'] = application.applicationTypeId.name;
      }

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
            // Skip applicationType if it's from form fields - we'll use the relation value instead
            // Form fields might contain slug (e.g., "private-limited") instead of name (e.g., "Private Limited")
            if (propertyName === 'applicationType') {
              continue;
            }
            details[propertyName] = detail.value;
          }
        }
      }

      // Add applicationType from the applicationTypeId relation if it exists (authoritative source)
      // This ensures we return the proper name (e.g., "Private Limited") instead of slug (e.g., "private-limited")
      if (application.applicationTypeId?.name) {
        details['applicationType'] = application.applicationTypeId.name;
      }

      // Step 5: Return the values with readable property names
      return {
        details: details,
      };
    } catch (error) {
      console.error('Error getting registration application details by userId:', error);
      return { details: {} };
    }
  }

  // Admin methods
  async findPendingApplications() {
    return this.registrationApplicationRepository.find({
      where: { status: ApplicationStatus.PENDING },
      relations: ['details', 'applicationTypeId'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateApplicationStatus(id: string, dto: UpdateApplicationStatusDto) {
    const application = await this.registrationApplicationRepository.findOne({ 
      where: { id },
      relations: ['details'] 
    });
    
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    application.status = dto.status;
    application.remarks = dto.remarks || null;

    await this.registrationApplicationRepository.save(application);

    // If approved, create user account
    if (dto.status === ApplicationStatus.APPROVED) {
      const userId = await this.createUserFromApplication(application);
      const user = await this.usersService.findOne(userId);
      if (user) {
        application.user = user;
        await this.registrationApplicationRepository.save(application);
      }
    }

    return this.findOne(id);
  }

  private async createUserFromApplication(application: RegistrationApplication): Promise<string> {
    try {
      // Get form fields to find email field by type
      const formFields = await this.formFieldRepository.find({
        where: { formId: application.formId },
      });

      // Find the email field by type
      const emailField = formFields.find(f => f.type === 'email');
      
      if (!emailField) {
        throw new Error('Email field not found in form definition');
      }

      // Extract user data from application details using field keys
      const emailDetail = application.details?.find(d => d.key === emailField.fieldKey);
      
      // Business/Company name labels (same as users.service.ts)
      const businessNameLabels = [
        'Business / Applicant Name (as per CNIC)',
        'Business Name of Partnership (as per registration)',
        'Company Name (as per SECP Registration)',
        'Company Name (as per SECP Registration)',
        'testign123',
        'Business / Company Name',
      ];

      // Find business/company name from details by label
      const businessNameDetail = application.details?.find(d => 
        d.label && businessNameLabels.includes(d.label)
      );

      if (!emailDetail?.value) {
        throw new Error('Email value not found in application details');
      }

      // Find the Applicant role
      const applicantRole = await this.roleRepository.findOne({ 
        where: { name: 'Applicant' } 
      });

      if (!applicantRole) {
        throw new Error('Applicant role not found');
      }

      // Generate a random strong password
      // const randomPassword = this.generateSecurePassword();

      // Create user with business name as firstName, lastName always N/A
      const createdUser = await this.usersService.create({
        email: emailDetail.value,
        password: "Password@123",
        firstName: businessNameDetail?.value || 'N/A',
        lastName: 'N/A',
        roleId: applicantRole.id,
        organizationId: null,
      });

      return createdUser.id;

    } catch (error) {
      // Log error but don't fail the approval process
      console.error('Failed to create user from application:', error.message);
      throw error; // Re-throw to handle in calling method
    }
  }

  private generateSecurePassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Ensure at least one of each required character type
    const password = [
      uppercase[Math.floor(Math.random() * uppercase.length)],
      lowercase[Math.floor(Math.random() * lowercase.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    // Fill remaining characters randomly
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = password.length; i < 12; i++) {
      password.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }

    // Shuffle the password array
    return password.sort(() => Math.random() - 0.5).join('');
  }

  async updateDetailStatus(applicationId: string, detailId: string, dto: UpdateDetailStatusDto) {
    // Verify application exists
    const application = await this.registrationApplicationRepository.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    // Find and update the detail
    const detail = await this.registrationApplicationDetailsRepository.findOne({
      where: { id: detailId },
      relations: ['application'],
    });

    if (!detail) {
      throw new NotFoundException(`Detail with ID ${detailId} not found`);
    }

    if (detail.application.id !== applicationId) {
      throw new NotFoundException(`Detail ${detailId} does not belong to application ${applicationId}`);
    }

    detail.status = dto.status;
    detail.remarks = dto.remarks || null;
    await this.registrationApplicationDetailsRepository.save(detail);

    // Auto-update application status based on field action
    if (dto.status === DetailStatus.APPROVED) {
      // Any field verified → Application becomes IN_PROCESS
      application.status = ApplicationStatus.IN_PROCESS;
      await this.registrationApplicationRepository.save(application);
    }

    const updatedApplication = await this.findOne(applicationId);

    // Check if all fields are approved
    const isApproved = updatedApplication?.details.every((detail) => detail.status === DetailStatus.APPROVED);
    if (isApproved || dto.status === DetailStatus.REJECTED) {
      application.status = ApplicationStatus.SENT_TO_HOD;
      await this.registrationApplicationRepository.save(application);
    }
    return updatedApplication;
    
  }

  /**
   * Upload admin document for registration application detail
   */
  async uploadAdminDocument(
    registrationId: string,
    detailId: string,
    file: any,
  ): Promise<UploadAdminDocumentResponseDto> {
    // Validate application exists
    const application = await this.registrationApplicationRepository.findOne({
      where: { id: registrationId },
    });

    if (!application) {
      throw new NotFoundException(`Registration application with ID '${registrationId}' not found`);
    }

    // Validate detail exists and belongs to application
    const detail = await this.registrationApplicationDetailsRepository.findOne({
      where: {
        id: detailId,
        application: { id: registrationId },
      },
      relations: ['application'],
    });

    if (!detail) {
      throw new NotFoundException(
        `Detail with ID '${detailId}' not found for application '${registrationId}'`,
      );
    }

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx'];
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

    const { encrypted, iv, authTag } = encryptBuffer(file.buffer);
    
    // Save file to disk
    // await fs.writeFile(filePath, file.buffer);
    await fs.writeFile(filePath, encrypted);

    // Create document record
    const document = this.adminRegistrationDocumentRepository.create({
      applicationId: registrationId,
      detailId: detailId,
      document: documentPath,
      iv,
      authTag,
      originalName: file.originalname || undefined,
      mimeType: file.mimetype || undefined,
      size: file.size || undefined,
    });

    const savedDocument = await this.adminRegistrationDocumentRepository.save(document);

    return {
      id: savedDocument.id,
      applicationId: savedDocument.applicationId,
      detailId: savedDocument.detailId,
      document: savedDocument.document,
      createdAt: savedDocument.createdAt,
      updatedAt: savedDocument.updatedAt,
      iv,
      authTag,
    };
  }

  /**
   * Get admin documents by registration application ID
   */
  async getAdminDocumentsByApplicationId(applicationId: string): Promise<UploadAdminDocumentResponseDto[]> {
    const documents = await this.adminRegistrationDocumentRepository.find({
      where: { applicationId },
      order: { createdAt: 'DESC' },
    });

    return documents.map((doc) => ({
      id: doc.id,
      applicationId: doc.applicationId,
      detailId: doc.detailId,
      document: doc.document,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }

  /**
   * Get admin documents by detail ID
   */
  async getAdminDocumentsByDetailId(detailId: string): Promise<UploadAdminDocumentResponseDto[]> {
    const documents = await this.adminRegistrationDocumentRepository.find({
      where: { detailId },
      order: { createdAt: 'DESC' },
    });

    return documents.map((doc) => ({
      id: doc.id,
      applicationId: doc.applicationId,
      detailId: doc.detailId,
      document: doc.document,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }

  /**
   * Get admin documents by registration ID and detail ID
   */
  async getAdminDocumentsByRegistrationAndDetail(
    registrationId: string,
    detailId: string,
  ): Promise<UploadAdminDocumentResponseDto[]> {
    const documents = await this.adminRegistrationDocumentRepository.find({
      where: {
        applicationId: registrationId,
        detailId: detailId,
      },
      order: { createdAt: 'DESC' },
    });

    return documents.map((doc) => ({
      id: doc.id,
      applicationId: doc.applicationId,
      detailId: doc.detailId,
      document: doc.document,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }

  /**
   * Download and decrypt admin document
   */
  async downloadAdminDocument(documentId: string): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    // Find the document
    const document = await this.adminRegistrationDocumentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Admin document with ID '${documentId}' not found`);
    }

    // Extract filename from document path (e.g., /uploads/uuid.pdf -> uuid.pdf)
    const filename = document.document.split('/').pop() || document.document;
    const filePath = path.join(this.uploadDir, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException(`File for document '${documentId}' not found on disk`);
    }

    // Read encrypted file
    const encryptedBuffer = await fs.readFile(filePath);

    // Decrypt if iv and authTag are present
    let decryptedBuffer: Buffer;
    if (document.iv && document.authTag) {
      try {
        decryptedBuffer = decryptBuffer(encryptedBuffer, document.iv, document.authTag);
      } catch (error) {
        throw new BadRequestException(`Failed to decrypt document: ${error.message}`);
      }
    } else {
      // If no encryption metadata, assume file is not encrypted
      decryptedBuffer = encryptedBuffer;
    }

    // Determine MIME type from document metadata or file extension
    const mimeType = document.mimeType || this.getMimeTypeFromExtension(filename);
    const displayFilename = document.originalName || filename;

    return {
      buffer: decryptedBuffer,
      mimeType,
      filename: displayFilename,
    };
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }
}

