import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WarehouseLocation, WarehouseLocationStatus } from '../warehouse-location/entities/warehouse-location.entity';
import { WarehouseOperatorApplicationRequest, WarehouseOperatorApplicationStatus } from '../warehouse/entities/warehouse-operator-application-request.entity';

@Injectable()
export class ApplicantService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
    @InjectRepository(WarehouseOperatorApplicationRequest)
    private readonly warehouseOperatorApplicationRequestRepository: Repository<WarehouseOperatorApplicationRequest>,
  ) { }

  async getStats(userId: string) {

    const activeApplicationCount = await Promise.all([
      this.warehouseLocationRepository.count({
        where: {
          userId,
          status: In([WarehouseLocationStatus.PENDING, WarehouseLocationStatus.REJECTED]),
        },
      }),
      this.warehouseOperatorApplicationRequestRepository.count({
        where: {
          userId,
          status: In([WarehouseOperatorApplicationStatus.PENDING, WarehouseOperatorApplicationStatus.REJECTED]),
        },
      }),
    ]).then(([locationCount, operatorCount]) => locationCount + operatorCount);

    const approvedApplicationCount = await this.warehouseLocationRepository.count({
      where: {
        userId,
        status: WarehouseLocationStatus.APPROVED,
        isActive: true,
      },
    });

    // Get the warehouse operator application request status (most recent one)
    const warehouseOperatorApplication = await this.warehouseOperatorApplicationRequestRepository.findOne({
      where: {
        userId,
      },
      order: {
        createdAt: 'DESC',
      },
      select: ['status'],
    });

    return {
      activeApplicationCount,
      approvedApplicationCount,
      warehouseOperatorApplicationStatus: warehouseOperatorApplication?.status || null,
    };
  }
}
