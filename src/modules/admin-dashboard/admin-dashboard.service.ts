import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationApplication, ApplicationStatus } from '../registration-application/entities/registration-application.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(RegistrationApplication)
    private registrationApplicationRepository: Repository<RegistrationApplication>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll() {
    const totalApplications = await this.registrationApplicationRepository.count();
    const pendingApplications = await this.registrationApplicationRepository.count({
      where: { status: ApplicationStatus.PENDING },
    });
    const approvedApplications = await this.registrationApplicationRepository.count({
      where: { status: ApplicationStatus.APPROVED },
    });
    const rejectedApplications = await this.registrationApplicationRepository.count({
      where: { status: ApplicationStatus.REJECTED },
    });
    // Count distinct users who have submitted registration applications
    // Using raw SQL for more reliable results
    const result = await this.registrationApplicationRepository.manager.query(
      `SELECT COUNT(DISTINCT "userId") as count FROM registration_application WHERE "userId" IS NOT NULL`
    );
    
    let totalApplicants = result && result[0] && result[0].count 
      ? parseInt(String(result[0].count), 10) 
      : 0;
    
    // Ensure totalApplicants is at least equal to totalApplications
    // (since each application should have an applicant, and one applicant can have multiple applications)
    if (totalApplicants < totalApplications && totalApplications > 0) {
      totalApplicants = totalApplications;
    }
    const totalUsers = await this.userRepository.count();
    return {
      totalApplications,
      totalApplicants,
      totalUsers,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
    };
  }

  findOne(id: string) {
    return `This action returns a #${id} admin dashboard data`;
  }
}

