import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFireSafetyDto } from './dto/create-fire-safety.dto';
import { UpdateFireSafetyDto } from './dto/update-fire-safety.dto';
import { FireSafety } from './entities/fire-safety.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';

@Injectable()
export class FireSafetyService {
  constructor(
    @InjectRepository(FireSafety)
    private readonly fireSafetyRepository: Repository<FireSafety>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
  ) {}

  /**
   * Get fire safety by warehouse location ID
   */
  async findByWarehouseLocationId(warehouseLocationId: string, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    const fireSafety = await this.fireSafetyRepository.findOne({
      where: { warehouseLocationId },
    });

    return fireSafety;
  }

  /**
   * Create or update fire safety by warehouse location ID
   */
  async create(warehouseLocationId: string, createFireSafetyDto: CreateFireSafetyDto, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Fire safety can only be added while application is in draft status');
    }

    const existingFireSafety = await this.fireSafetyRepository.findOne({
      where: { warehouseLocationId },
    });

    if (existingFireSafety) {
      Object.assign(existingFireSafety, createFireSafetyDto);
      return this.fireSafetyRepository.save(existingFireSafety);
    }

    const fireSafety = this.fireSafetyRepository.create({
      warehouseLocationId,
      ...createFireSafetyDto,
    });

    const savedFireSafety = await this.fireSafetyRepository.save(fireSafety);

    await this.warehouseLocationRepository.update(warehouseLocationId, {
      fireSafety: savedFireSafety,
    });

    return savedFireSafety;
  }

  /**
   * Update fire safety by warehouse location ID
   */
  async updateByWarehouseLocationId(
    warehouseLocationId: string,
    updateFireSafetyDto: CreateFireSafetyDto,
    userId: string
  ) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Fire safety can only be updated while application is in draft status');
    }

    const fireSafety = await this.fireSafetyRepository.findOne({
      where: { warehouseLocationId },
    });

    if (!fireSafety) {
      throw new NotFoundException('Fire safety not found for this application');
    }

    Object.assign(fireSafety, updateFireSafetyDto);
    return this.fireSafetyRepository.save(fireSafety);
  }

  findAll() {
    return `This action returns all fireSafety`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fireSafety`;
  }

  update(id: number, updateFireSafetyDto: UpdateFireSafetyDto) {
    return `This action updates a #${id} fireSafety`;
  }

  remove(id: number) {
    return `This action removes a #${id} fireSafety`;
  }
}
