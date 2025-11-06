import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationApplication } from '../registration-application/entities/registration-application.entity';
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
    const totalApplicants = await this.registrationApplicationRepository.count();
    const totalUsers = await this.userRepository.count({
      where: {
        userRoles: {
          role: {
            name: 'APPLICANT',
          },
        },
      },
      relations: ['userRoles'],
    });
    return {
      totalApplications,
      totalApplicants,
      totalUsers,
    };
  }

  findOne(id: string) {
    return `This action returns a #${id} admin dashboard data`;
  }
}

