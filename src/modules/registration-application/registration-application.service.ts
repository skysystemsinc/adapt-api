import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { RegistrationApplication, ApplicationStatus } from './entities/registration-application.entity';
import { RegistrationApplicationDetails, DetailStatus } from './entities/registration-application-details.entity';
import { CreateRegistrationApplicationDto } from './dto/create-registration-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { UpdateDetailStatusDto } from './dto/update-detail-status.dto';
import { QueryRegistrationApplicationDto } from './dto/query-registration-application.dto';
import { ApplicationType } from '../application-type/entities/application-type.entity';

@Injectable()
export class RegistrationApplicationService {
  constructor(
    @InjectRepository(RegistrationApplication)
    private registrationApplicationRepository: Repository<RegistrationApplication>,
    @InjectRepository(RegistrationApplicationDetails)
    private registrationApplicationDetailsRepository: Repository<RegistrationApplicationDetails>,
    @InjectRepository(ApplicationType)
    private applicationTypeRepository: Repository<ApplicationType>,
  ) {}

  findAll() {
    return this.registrationApplicationRepository.find({
      relations: ['details', 'applicationTypeId'],
    });
  }

  async findAllPaginated(query: QueryRegistrationApplicationDto) {
    const { page = 1, limit = 10, status, applicationTypeId, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

    const queryBuilder = this.registrationApplicationRepository
      .createQueryBuilder('application')
      .leftJoin('application.applicationTypeId', 'applicationType')
      .addSelect(['applicationType.name'])  // ← Only select name

      .leftJoinAndSelect(
        'application.details', 
        'details',
        'details.key IN (:...detailKey)',
        { detailKey: ['applicationName', 'emailId'] }
      );

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

  findOne(id: string) {
    return this.registrationApplicationRepository.findOne({ 
      where: { id },
      relations: ['details', 'applicationTypeId'],
    });
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
    
    // Transform formData object into detail records
    if (data.formData && Object.keys(data.formData).length > 0) {
      const details = Object.entries(data.formData).map(([key, value]) => {
        return this.registrationApplicationDetailsRepository.create({
          application: savedApplication,
          key,
          value: String(value), // Convert value to string
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
    const application = await this.registrationApplicationRepository.findOne({ where: { id } });
    
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    application.status = dto.status;
    if (dto.remarks) {
      application.metadata = dto.remarks;
    }

    await this.registrationApplicationRepository.save(application);
    return this.findOne(id);
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
    await this.registrationApplicationDetailsRepository.save(detail);

    return this.findOne(applicationId);
  }
}

