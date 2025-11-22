import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWarehouseLocationDto } from './dto/create-warehouse-location.dto';
import { UpdateWarehouseLocationDto } from './dto/update-warehouse-location.dto';
import { WarehouseLocation, WarehouseLocationStatus } from './entities/warehouse-location.entity';

@Injectable()
export class WarehouseLocationService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
  ) { }

  async create(createWarehouseLocationDto: CreateWarehouseLocationDto, userId: string) {

    const existingDraft = await this.warehouseLocationRepository.findOne({
      where: { userId, status: WarehouseLocationStatus.DRAFT },
    });

    if (existingDraft) {
      throw new BadRequestException(
        'You already have a draft application. Please update your existing application instead of creating a new one.'
      );
    }

    const activeApplications = await this.warehouseLocationRepository.find({
      where: { userId },
    });

    const hasActiveApplication = activeApplications.some(
      (app) =>
        app.status === WarehouseLocationStatus.DRAFT ||
        app.status === WarehouseLocationStatus.PENDING ||
        app.status === WarehouseLocationStatus.IN_PROCESS
    );

    if (hasActiveApplication) {
      throw new BadRequestException(
        'You have an active application that is not yet submitted. Please submit or complete your existing application before creating a new one.'
      );
    }

    const newApplication = this.warehouseLocationRepository.create({
      userId,
      status: WarehouseLocationStatus.DRAFT,
    });

    const savedApplication = await this.warehouseLocationRepository.save(newApplication);

    return {
      message: 'Warehouse location application created successfully',
      applicationId: savedApplication.id,
      status: savedApplication.status,
    };
  }

  findAll() {
    return `This action returns all warehouseLocation`;
  }

  async findAllByUserId(userId: string): Promise<{ applicationId: string; status: string }[]> {
    const applications = await this.warehouseLocationRepository.find({
      where: { userId },
      select: ['id', 'status'],
      order: { createdAt: 'DESC' },
    });

    return applications.map((app) => ({
      applicationId: app.id,
      status: app.status,
    }));
  }

  findOne(id: number) {
    return `This action returns a #${id} warehouseLocation`;
  }

  update(id: number, updateWarehouseLocationDto: UpdateWarehouseLocationDto) {
    return `This action updates a #${id} warehouseLocation`;
  }

  remove(id: number) {
    return `This action removes a #${id} warehouseLocation`;
  }
}
