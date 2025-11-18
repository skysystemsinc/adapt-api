import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWarehouseApplicantVerificationDto } from './dto/create-warehouse-applicant-verification.dto';
import { UpdateWarehouseApplicantVerificationDto } from './dto/update-warehouse-applicant-verification.dto';
import { ApproveVerificationDto } from './dto/approve-verification.dto';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { WarehouseApplicantVerification } from './entities/warehouse-applicant-verification.entity';
import { Repository } from 'typeorm';
import { ApprovalStatus } from '../../../common/enums/ApprovalStatus';

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

  async findOne(id: string) {
    const record = await this.repo.findOne({
      where: { id },
      select: [
        'id', 'fieldKey', 'fieldValue', 'status', 'remarks',
      ]
    });
    if (!record) throw new NotFoundException('Verification record not found');
    return record;
  }

  async findByEntityId(entityId: string) {
    const record = await this.repo.find({
      where: { entityId },
      select: [
        'id', 'fieldKey', 'fieldValue', 'status', 'remarks',
      ]
    });
    if (!record) throw new NotFoundException('Verification record not found');
    return record;
  }
  
  async findByEntityKey(id: string, key: string) {
    const record = await this.repo.find({
      where: { fieldKey: key, applicationId: id },
      select: [
        'id', 'fieldKey', 'fieldValue', 'status', 'remarks', 'applicationId', 'entityId', 'entityType',
      ]
    });
    if (!record) throw new NotFoundException('Verification record not found');
    return record;
  }

  async update(id: string, updateWarehouseApplicantVerificationDto: UpdateWarehouseApplicantVerificationDto) {
    const record = await this.findOne(id);
    const updated = Object.assign(record, updateWarehouseApplicantVerificationDto);
    return this.repo.save(updated);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  async approve(id: string, approveDto: ApproveVerificationDto, userId: string) {
    const record = await this.findOne(id);

    record.status = ApprovalStatus.APPROVED;
    record.approvedBy = userId;
    record.approvedAt = new Date();
    record.remarks = approveDto.remarks || record.remarks;

    return this.repo.save(record);
  }

  async reject(id: string, rejectDto: RejectVerificationDto, userId: string) {
    const record = await this.findOne(id);

    record.status = ApprovalStatus.REJECTED;
    record.rejectedBy = userId;
    record.rejectedAt = new Date();
    record.remarks = rejectDto.remarks;
    record.approvedBy = null;
    record.approvedAt = null;

    return this.repo.save(record);
  }
}
