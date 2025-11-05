import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { plainToInstance, instanceToPlain } from 'class-transformer';
import { RegistrationApplication, ApplicationStatus } from './entities/registration-application.entity';
import { RegistrationApplicationDetails, DetailStatus } from './entities/registration-application-details.entity';
import { CreateRegistrationApplicationDto } from './dto/create-registration-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { UpdateDetailStatusDto } from './dto/update-detail-status.dto';
import { QueryRegistrationApplicationDto } from './dto/query-registration-application.dto';
import { SubmitRegistrationDto } from './dto/submit-registration.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';
import { ApplicationType } from '../application-type/entities/application-type.entity';
import { calculateDaysCount, calculateBusinessDays, isApplicationOverdue } from '../../common/utils/date.utils';
import { UsersService } from '../users/users.service';
import { Role } from '../rbac/entities/role.entity';
import { FormField } from '../forms/entities/form-field.entity';

@Injectable()
export class RegistrationApplicationService {
  constructor(
    @InjectRepository(RegistrationApplication)
    private registrationApplicationRepository: Repository<RegistrationApplication>,
    @InjectRepository(RegistrationApplicationDetails)
    private registrationApplicationDetailsRepository: Repository<RegistrationApplicationDetails>,
    @InjectRepository(ApplicationType)
    private applicationTypeRepository: Repository<ApplicationType>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(FormField)
    private formFieldRepository: Repository<FormField>,
    private usersService: UsersService,
  ) {}

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
      await this.createUserFromApplication(application);
    }

    return this.findOne(id);
  }

  private async createUserFromApplication(application: RegistrationApplication): Promise<void> {
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
      const firstNameDetail = application.details?.find(d => d.key.toLowerCase().includes('firstname') || d.key.toLowerCase().includes('first_name'));
      const lastNameDetail = application.details?.find(d => d.key.toLowerCase().includes('lastname') || d.key.toLowerCase().includes('last_name'));

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

      // Create user
      await this.usersService.create({
        email: emailDetail.value,
        password: "Password@123",
        firstName: firstNameDetail?.value || 'First Name',
        lastName: lastNameDetail?.value || 'Last Name',
        roleId: applicantRole.id,
      });

    } catch (error) {
      // Log error but don't fail the approval process
      console.error('Failed to create user from application:', error.message);
      // You might want to set a flag on the application indicating user creation failed
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
}

