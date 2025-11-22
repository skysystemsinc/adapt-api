import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { Facility } from './entities/facility.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';

@Injectable()
export class FacilityService {
  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
  ) {}

  async create(warehouseLocationId: string, createFacilityDto: CreateFacilityDto, userId: string) {
    // Verify warehouse location exists and belongs to user
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Facility can only be added while application is in draft status');
    }

    // Check if facility already exists for this application
    const existingFacility = await this.facilityRepository.findOne({
      where: { warehouseLocationId },
    });

    if (existingFacility) {
      // Update existing facility
      existingFacility.facilityName = createFacilityDto.facilityName;
      existingFacility.storageFacilityType = createFacilityDto.storageFacilityType;
      existingFacility.address = createFacilityDto.address;
      existingFacility.numberOfStorageUnits = createFacilityDto.numberOfStorageUnits;
      existingFacility.individualCapacityPerUnit = createFacilityDto.individualCapacityPerUnit;
      existingFacility.totalCapacity = createFacilityDto.totalCapacity;
      existingFacility.storageFacilitiesAppliedFor = createFacilityDto.storageFacilitiesAppliedFor;
      existingFacility.produceForAccreditation = createFacilityDto.produceForAccreditation;
      existingFacility.totalCapacityAppliedFor = createFacilityDto.totalCapacityAppliedFor;
      existingFacility.plinthHeight = createFacilityDto.plinthHeight;
      existingFacility.length = createFacilityDto.length;
      existingFacility.width = createFacilityDto.width;
      existingFacility.height = createFacilityDto.height;
      existingFacility.ownership = createFacilityDto.ownership;
      existingFacility.leaseDuration = createFacilityDto.leaseDuration ?? null;
      existingFacility.borrowerCodeOfPropertyOwner = createFacilityDto.borrowerCodeOfPropertyOwner ?? null;
      return this.facilityRepository.save(existingFacility);
    }

    // Create new facility
    const facility = this.facilityRepository.create({
      warehouseLocationId,
      facilityName: createFacilityDto.facilityName,
      storageFacilityType: createFacilityDto.storageFacilityType,
      address: createFacilityDto.address,
      numberOfStorageUnits: createFacilityDto.numberOfStorageUnits,
      individualCapacityPerUnit: createFacilityDto.individualCapacityPerUnit,
      totalCapacity: createFacilityDto.totalCapacity,
      storageFacilitiesAppliedFor: createFacilityDto.storageFacilitiesAppliedFor,
      produceForAccreditation: createFacilityDto.produceForAccreditation,
      totalCapacityAppliedFor: createFacilityDto.totalCapacityAppliedFor,
      plinthHeight: createFacilityDto.plinthHeight,
      length: createFacilityDto.length,
      width: createFacilityDto.width,
      height: createFacilityDto.height,
      ownership: createFacilityDto.ownership,
      leaseDuration: createFacilityDto.leaseDuration ?? null,
      borrowerCodeOfPropertyOwner: createFacilityDto.borrowerCodeOfPropertyOwner ?? null,
    });

    const savedFacility = await this.facilityRepository.save(facility);

    // Update warehouse location with facility relationship
    await this.warehouseLocationRepository.update(warehouseLocationId, {
      facility: savedFacility,
    });

    return savedFacility;
  }

  /**
   * Get facility by warehouse location ID
   */
  async findByWarehouseLocationId(warehouseLocationId: string, userId: string) {
    // Verify warehouse location exists and belongs to user
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    const facility = await this.facilityRepository.findOne({
      where: { warehouseLocationId },
    });

    return facility;
  }

  /**
   * Update facility by warehouse location ID
   */
  async updateByWarehouseLocationId(
    warehouseLocationId: string,
    updateFacilityDto: CreateFacilityDto,
    userId: string
  ) {
    // Verify warehouse location exists and belongs to user
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Facility can only be updated while application is in draft status');
    }

    const facility = await this.facilityRepository.findOne({
      where: { warehouseLocationId },
    });

    if (!facility) {
      throw new NotFoundException('Facility not found for this application');
    }

    // Update facility fields
    Object.assign(facility, updateFacilityDto);
    return this.facilityRepository.save(facility);
  }

  findAll() {
    return `This action returns all facility`;
  }

  findOne(id: number) {
    return `This action returns a #${id} facility`;
  }

  update(id: number, updateFacilityDto: UpdateFacilityDto) {
    return `This action updates a #${id} facility`;
  }

  remove(id: number) {
    return `This action removes a #${id} facility`;
  }
}
