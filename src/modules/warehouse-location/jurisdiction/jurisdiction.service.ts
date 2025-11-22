import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJurisdictionDto } from './dto/create-jurisdiction.dto';
import { UpdateJurisdictionDto } from './dto/update-jurisdiction.dto';
import { Jurisdiction } from './entities/jurisdiction.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';

@Injectable()
export class JurisdictionService {
  constructor(
    @InjectRepository(Jurisdiction)
    private readonly jurisdictionRepository: Repository<Jurisdiction>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
  ) {}

  /**
   * Get jurisdiction by warehouse location ID
   */
  async findByWarehouseLocationId(warehouseLocationId: string, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    const jurisdiction = await this.jurisdictionRepository.findOne({
      where: { warehouseLocationId },
    });

    return jurisdiction;
  }

  /**
   * Create or update jurisdiction by warehouse location ID
   */
  async create(warehouseLocationId: string, createJurisdictionDto: CreateJurisdictionDto, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Jurisdiction can only be added while application is in draft status');
    }

    const existingJurisdiction = await this.jurisdictionRepository.findOne({
      where: { warehouseLocationId },
    });

    if (existingJurisdiction) {
      Object.assign(existingJurisdiction, createJurisdictionDto);
      return this.jurisdictionRepository.save(existingJurisdiction);
    }

    const jurisdiction = this.jurisdictionRepository.create({
      warehouseLocationId,
      ...createJurisdictionDto,
    });

    const savedJurisdiction = await this.jurisdictionRepository.save(jurisdiction);

    await this.warehouseLocationRepository.update(warehouseLocationId, {
      jurisdiction: savedJurisdiction,
    });

    return savedJurisdiction;
  }

  /**
   * Update jurisdiction by warehouse location ID
   */
  async updateByWarehouseLocationId(
    warehouseLocationId: string,
    updateJurisdictionDto: CreateJurisdictionDto,
    userId: string
  ) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Jurisdiction can only be updated while application is in draft status');
    }

    const jurisdiction = await this.jurisdictionRepository.findOne({
      where: { warehouseLocationId },
    });

    if (!jurisdiction) {
      throw new NotFoundException('Jurisdiction not found for this application');
    }

    Object.assign(jurisdiction, updateJurisdictionDto);
    return this.jurisdictionRepository.save(jurisdiction);
  }

  findAll() {
    return `This action returns all jurisdiction`;
  }

  findOne(id: number) {
    return `This action returns a #${id} jurisdiction`;
  }

  update(id: number, updateJurisdictionDto: UpdateJurisdictionDto) {
    return `This action updates a #${id} jurisdiction`;
  }

  remove(id: number) {
    return `This action removes a #${id} jurisdiction`;
  }
}
