import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { QueryLocationApplicationDto } from './dto/query-location-application.dto';
import { WarehouseLocation, WarehouseLocationStatus } from '../warehouse-location/entities/warehouse-location.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WarehouseLocationAdminService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private warehouseLocationRepository: Repository<WarehouseLocation>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async findAllWarehouseLocationsPaginated(query: QueryLocationApplicationDto) {
    const { page = 1, status, search, limit = 10, sortBy = 'createdAt', sortOrder = 'ASC' } = query;

    const queryBuilder = this.warehouseLocationRepository
      .createQueryBuilder('location')
      .leftJoin('location.user', 'user')
      .leftJoin('location.facility', 'facility')
      .select([
        'location.id',
        'location.status',
        'location.createdAt',
        'location.updatedAt',
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'facility.id',
        'facility.facilityName',
      ]);

    if (status) {
      queryBuilder.andWhere('location.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR facility.facilityName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    queryBuilder.orderBy(`location.${sortBy}`, sortOrder);
    queryBuilder.addOrderBy('location.createdAt', 'ASC');

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

  async findOne(id: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        facility: {
          id: true,
          facilityName: true,
          storageFacilityType: true,
          address: true,
          numberOfStorageUnits: true,
          totalCapacity: true,
          ownership: true,
        },
        contact: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          mobileNumber: true,
        },
        jurisdiction: {
          id: true,
          jurisdictionalPoliceStationName: true,
          nearestFireStationName: true,
        },
        security: {
          id: true,
          guardsDeployed: true,
          NumberOfCameras: true,
        },
        fireSafety: {
          id: true,
          fireExtinguishers: true,
          fireBuckets: true,
        },
        weighing: {
          id: true,
          weighbridgeAvailable: true,
          weighbridgeLocation: true,
        },
        technicalQualitative: {
          id: true,
          laboratoryFacility: true,
          electricityAvailable: true,
        },
        humanResources: {
          id: true,
        },
      },
      relations: {
        user: true,
        facility: true,
        contact: true,
        jurisdiction: true,
        security: true,
        fireSafety: true,
        weighing: true,
        technicalQualitative: true,
        humanResources: true,
      },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    // Calculate total count of related entities
    const totalCount =
      (warehouseLocation.facility ? 1 : 0) +
      (warehouseLocation.contact ? 1 : 0) +
      (warehouseLocation.jurisdiction ? 1 : 0) +
      (warehouseLocation.security ? 1 : 0) +
      (warehouseLocation.fireSafety ? 1 : 0) +
      (warehouseLocation.weighing ? 1 : 0) +
      (warehouseLocation.technicalQualitative ? 1 : 0) +
      (warehouseLocation.humanResources?.length || 0);

    return {
      ...warehouseLocation,
      totalCount,
    };
  }

  private async getFirstPendingApplicationId(): Promise<string | null> {
    const firstPending = await this.warehouseLocationRepository.findOne({
      where: { status: WarehouseLocationStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
    return firstPending?.id || null;
  }
}

