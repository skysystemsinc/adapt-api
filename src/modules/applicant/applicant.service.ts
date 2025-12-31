import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  WarehouseLocation,
  WarehouseLocationStatus,
} from '../warehouse-location/entities/warehouse-location.entity';
import {
  WarehouseOperatorApplicationRequest,
  WarehouseOperatorApplicationStatus,
} from '../warehouse/entities/warehouse-operator-application-request.entity';

@Injectable()
export class ApplicantService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
    @InjectRepository(WarehouseOperatorApplicationRequest)
    private readonly warehouseOperatorApplicationRequestRepository: Repository<WarehouseOperatorApplicationRequest>,
  ) {}

  async getStats(userId: string) {
    
    const allApprovedApplicationCount = await Promise.all([
      this.warehouseLocationRepository.count({
        where: {
          userId,
          status: WarehouseLocationStatus.APPROVED,
        },
      }),
      this.warehouseOperatorApplicationRequestRepository.count({
        where: {
          userId,
          status: WarehouseOperatorApplicationStatus.APPROVED,
        },
      }),
    ]).then(([locationCount, operatorCount]) => locationCount + operatorCount);

    const rejectedApplicationCount = await Promise.all([
      this.warehouseLocationRepository.count({
        where: {
          userId,
          status: WarehouseLocationStatus.REJECTED,
        },
      }),
      this.warehouseOperatorApplicationRequestRepository.count({
        where: {
          userId,
          status: WarehouseOperatorApplicationStatus.REJECTED,
        },
      }),
    ]).then(([locationCount, operatorCount]) => locationCount + operatorCount);
    const pendingApplicationCount = await Promise.all([
      this.warehouseLocationRepository.count({
        where: {
          userId,
          status: WarehouseLocationStatus.PENDING,
        },
      }),
      this.warehouseOperatorApplicationRequestRepository.count({
        where: {
          userId,
          status: WarehouseOperatorApplicationStatus.PENDING,
        },
      }),
    ]).then(([locationCount, operatorCount]) => locationCount + operatorCount);
    const allApplicationCount = await Promise.all([
      this.warehouseLocationRepository.count({
        where: {
          userId,
        },
      }),
      this.warehouseOperatorApplicationRequestRepository.count({
        where: {
          userId,
        },
      }),
    ]).then(([locationCount, operatorCount]) => locationCount + operatorCount);


    // Get the warehouse operator application request status (most recent one)
    const warehouseOperatorApplication =
      await this.warehouseOperatorApplicationRequestRepository.findOne({
        where: {
          userId,
        },
        order: {
          createdAt: 'DESC',
        },
        select: ['status'],
      });

    return {
      allApprovedApplicationCount,
      rejectedApplicationCount,
      pendingApplicationCount,
      allApplicationCount,
      warehouseOperatorApplicationStatus:
        warehouseOperatorApplication?.status || null,
    };
  }
}
