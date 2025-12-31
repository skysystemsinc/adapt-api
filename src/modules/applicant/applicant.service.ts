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
import { WarehouseOperator } from '../warehouse/entities/warehouse-operator.entity';

@Injectable()
export class ApplicantService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
    @InjectRepository(WarehouseOperatorApplicationRequest)
    private readonly warehouseOperatorApplicationRequestRepository: Repository<WarehouseOperatorApplicationRequest>,
    @InjectRepository(WarehouseOperator)
    private readonly warehouseOperatorRepository: Repository<WarehouseOperator>,
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
  async getApplication(userId: string) {
   const warehouseOperator = await this.warehouseOperatorRepository.find({
      where: {
        userId,
      },
      order: {
        createdAt: 'DESC',
      },
      select: {
        applicationId: true,
        application: {
          id: true,
    
          applicationId: true,
        }
      },
      relations: [ 'application'],
    })
    
    
    return warehouseOperator;
  }

}
