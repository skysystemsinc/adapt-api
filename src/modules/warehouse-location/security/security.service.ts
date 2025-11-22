import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSecurityDto } from './dto/create-security.dto';
import { UpdateSecurityDto } from './dto/update-security.dto';
import { Security } from './entities/security.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';

@Injectable()
export class SecurityService {
  constructor(
    @InjectRepository(Security)
    private readonly securityRepository: Repository<Security>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
  ) {}

  /**
   * Get security by warehouse location ID
   */
  async findByWarehouseLocationId(warehouseLocationId: string, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    const security = await this.securityRepository.findOne({
      where: { warehouseLocationId },
    });

    return security;
  }

  /**
   * Create or update security by warehouse location ID
   */
  async create(warehouseLocationId: string, createSecurityDto: CreateSecurityDto, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Security can only be added while application is in draft status');
    }

    const existingSecurity = await this.securityRepository.findOne({
      where: { warehouseLocationId },
    });

    if (existingSecurity) {
      Object.assign(existingSecurity, createSecurityDto);
      return this.securityRepository.save(existingSecurity);
    }

    const security = this.securityRepository.create({
      warehouseLocationId,
      ...createSecurityDto,
    });

    const savedSecurity = await this.securityRepository.save(security);

    await this.warehouseLocationRepository.update(warehouseLocationId, {
      security: savedSecurity,
    });

    return savedSecurity;
  }

  /**
   * Update security by warehouse location ID
   */
  async updateByWarehouseLocationId(
    warehouseLocationId: string,
    updateSecurityDto: CreateSecurityDto,
    userId: string
  ) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Security can only be updated while application is in draft status');
    }

    const security = await this.securityRepository.findOne({
      where: { warehouseLocationId },
    });

    if (!security) {
      throw new NotFoundException('Security not found for this application');
    }

    Object.assign(security, updateSecurityDto);
    return this.securityRepository.save(security);
  }

  findAll() {
    return `This action returns all security`;
  }

  findOne(id: number) {
    return `This action returns a #${id} security`;
  }

  update(id: number, updateSecurityDto: UpdateSecurityDto) {
    return `This action updates a #${id} security`;
  }

  remove(id: number) {
    return `This action removes a #${id} security`;
  }
}
