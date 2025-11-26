import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTechnicalQualitativeDto } from './dto/create-technical-qualitative.dto';
import { UpdateTechnicalQualitativeDto } from './dto/update-technical-qualitative.dto';
import { TechnicalQualitative } from './entities/technical-qualitative.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';

@Injectable()
export class TechnicalQualitativeService {
  constructor(
    @InjectRepository(TechnicalQualitative)
    private readonly technicalQualitativeRepository: Repository<TechnicalQualitative>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
  ) {}

  /**
   * Get technical qualitative by warehouse location ID
   */
  async findByWarehouseLocationId(warehouseLocationId: string, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    const technicalQualitative = await this.technicalQualitativeRepository.findOne({
      where: { warehouseLocationId },
    });

    return technicalQualitative;
  }

  /**
   * Create or update technical qualitative by warehouse location ID
   */
  async create(
    warehouseLocationId: string,
    createTechnicalQualitativeDto: CreateTechnicalQualitativeDto,
    userId: string
  ) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Technical qualitative can only be added while application is in draft status');
    }

    const existingTechnicalQualitative = await this.technicalQualitativeRepository.findOne({
      where: { warehouseLocationId },
    });

    if (existingTechnicalQualitative) {
      Object.assign(existingTechnicalQualitative, createTechnicalQualitativeDto);
      return this.technicalQualitativeRepository.save(existingTechnicalQualitative);
    }

    const technicalQualitative = this.technicalQualitativeRepository.create({
      warehouseLocationId,
      ...createTechnicalQualitativeDto,
    });

    const savedTechnicalQualitative = await this.technicalQualitativeRepository.save(technicalQualitative);

    await this.warehouseLocationRepository.update(warehouseLocationId, {
      technicalQualitative: savedTechnicalQualitative,
    });

    return savedTechnicalQualitative;
  }

  /**
   * Update technical qualitative by warehouse location ID
   */
  async updateByWarehouseLocationId(
    warehouseLocationId: string,
    updateTechnicalQualitativeDto: UpdateTechnicalQualitativeDto,
    userId: string
  ) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Technical qualitative can only be updated while application is in draft status');
    }

    const existingTechnicalQualitative = await this.technicalQualitativeRepository.findOne({
      where: { warehouseLocationId },
    });

    if (!existingTechnicalQualitative) {
      throw new NotFoundException('Technical qualitative not found for this application');
    }

    Object.assign(existingTechnicalQualitative, updateTechnicalQualitativeDto);
    return this.technicalQualitativeRepository.save(existingTechnicalQualitative);
  }
}

