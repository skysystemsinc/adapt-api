import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWeighingDto } from './dto/create-weighing.dto';
import { UpdateWeighingDto } from './dto/update-weighing.dto';
import { Weighing } from './entities/weighing.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';

@Injectable()
export class WeighingsService {
  constructor(
    @InjectRepository(Weighing)
    private readonly weighingRepository: Repository<Weighing>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
  ) {}

  /**
   * Get weighing by warehouse location ID
   */
  async findByWarehouseLocationId(warehouseLocationId: string, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    const weighing = await this.weighingRepository.findOne({
      where: { warehouseLocationId },
    });

    return weighing;
  }

  /**
   * Create or update weighing by warehouse location ID
   */
  async create(warehouseLocationId: string, createWeighingDto: CreateWeighingDto, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Weighing can only be added while application is in draft status');
    }

    const existingWeighing = await this.weighingRepository.findOne({
      where: { warehouseLocationId },
    });

    if (existingWeighing) {
      Object.assign(existingWeighing, createWeighingDto);
      return this.weighingRepository.save(existingWeighing);
    }

    const weighing = this.weighingRepository.create({
      warehouseLocationId,
      ...createWeighingDto,
    });

    const savedWeighing = await this.weighingRepository.save(weighing);

    await this.warehouseLocationRepository.update(warehouseLocationId, {
      weighing: savedWeighing,
    });

    return savedWeighing;
  }

  /**
   * Update weighing by warehouse location ID
   */
  async updateByWarehouseLocationId(
    warehouseLocationId: string,
    updateWeighingDto: CreateWeighingDto,
    userId: string
  ) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Weighing can only be updated while application is in draft status');
    }

    const weighing = await this.weighingRepository.findOne({
      where: { warehouseLocationId },
    });

    if (!weighing) {
      throw new NotFoundException('Weighing not found for this application');
    }

    Object.assign(weighing, updateWeighingDto);
    return this.weighingRepository.save(weighing);
  }

  findAll() {
    return `This action returns all weighings`;
  }

  findOne(id: number) {
    return `This action returns a #${id} weighing`;
  }

  update(id: number, updateWeighingDto: UpdateWeighingDto) {
    return `This action updates a #${id} weighing`;
  }

  remove(id: number) {
    return `This action removes a #${id} weighing`;
  }
}
