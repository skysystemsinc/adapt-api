import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWarehouseApplicantVerificationDto } from './dto/create-warehouse-applicant-verification.dto';
import { UpdateWarehouseApplicantVerificationDto } from './dto/update-warehouse-applicant-verification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { WarehouseApplicantVerification } from './entities/warehouse-applicant-verification.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WarehouseApplicantVerificationService {
  constructor(
    @InjectRepository(WarehouseApplicantVerification)
    private readonly repo: Repository<WarehouseApplicantVerification>,
  ) { }

  create(createWarehouseApplicantVerificationDto: CreateWarehouseApplicantVerificationDto) {
    const verification = this.repo.create(createWarehouseApplicantVerificationDto);
    return this.repo.save(verification);
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Verification record not found');
    return record;
  }

  async update(id: number, updateWarehouseApplicantVerificationDto: UpdateWarehouseApplicantVerificationDto) {
    const record = await this.findOne(id);
    const updated = Object.assign(record, updateWarehouseApplicantVerificationDto);
    return this.repo.save(updated);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
