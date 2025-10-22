import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationApplication, ApplicationStatus } from './entities/registration-application.entity';
import { RegistrationApplicationDetails, DetailStatus } from './entities/registration-application-details.entity';
import { CreateRegistrationApplicationDto } from './dto/create-registration-application.dto';
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
}

