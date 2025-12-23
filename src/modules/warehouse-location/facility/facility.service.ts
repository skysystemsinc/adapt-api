import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { Facility } from './entities/facility.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';
import { FacilityHistory } from './entities/facility-history.entity';
import { Assignment, AssignmentLevel } from '../../warehouse/operator/assignment/entities/assignment.entity';
import { AssignmentStatus } from '../../warehouse/operator/assignment/entities/assignment.entity';
import { AssignmentSection } from '../../warehouse/operator/assignment/entities/assignment-section.entity';
import { In } from 'typeorm';
import { WarehouseLocationService } from '../warehouse-location.service';

@Injectable()
export class FacilityService {
  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
    private readonly dataSource: DataSource,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(AssignmentSection)
    private readonly assignmentSectionRepository: Repository<AssignmentSection>,
    @Inject(forwardRef(() => WarehouseLocationService))
    private readonly warehouseLocationService: WarehouseLocationService,
  ) { }

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

    if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED, WarehouseLocationStatus.RESUBMITTED].includes(warehouseLocation.status)) {
      throw new BadRequestException('Facility can only be updated while application is in draft status');
    }

    const existingFacility = await this.facilityRepository.findOne({
      where: { warehouseLocationId },
    });

    if (!existingFacility) {
      throw new NotFoundException('Facility not found for this application');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const facilityRepo = manager.getRepository(Facility);
      const facilityHistoryRepo = manager.getRepository(FacilityHistory);


      // Re-validate application status inside transaction to prevent race conditions
      if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED].includes(warehouseLocation.status)) {
        throw new BadRequestException('Cannot update facility after application is approved or submitted');
      }

      if (warehouseLocation.status === WarehouseLocationStatus.REJECTED) {
        // Save history of facility if application is rejected (before overwriting)
        const historyRecord = facilityHistoryRepo.create({
          facilityId: existingFacility.id,
          warehouseLocationId,
          facilityName: existingFacility.facilityName,
          storageFacilityType: existingFacility.storageFacilityType,
          address: existingFacility.address,
          numberOfStorageUnits: existingFacility.numberOfStorageUnits,
          individualCapacityPerUnit: existingFacility.individualCapacityPerUnit,
          totalCapacity: existingFacility.totalCapacity,
          storageFacilitiesAppliedFor: existingFacility.storageFacilitiesAppliedFor,
          produceForAccreditation: existingFacility.produceForAccreditation,
          totalCapacityAppliedFor: existingFacility.totalCapacityAppliedFor,
          plinthHeight: existingFacility.plinthHeight,
          length: existingFacility.length,
          width: existingFacility.width,
          height: existingFacility.height,
          ownership: existingFacility.ownership,
          leaseDuration: existingFacility.leaseDuration ?? null,
          borrowerCodeOfPropertyOwner: existingFacility.borrowerCodeOfPropertyOwner ?? null,
          isActive: false,
        });
        historyRecord.createdAt = existingFacility.createdAt;
        await facilityHistoryRepo.save(historyRecord);
      }

      // Overwrite existing facility with new information
      existingFacility.facilityName = updateFacilityDto.facilityName;
      existingFacility.storageFacilityType = updateFacilityDto.storageFacilityType;
      existingFacility.address = updateFacilityDto.address;
      existingFacility.numberOfStorageUnits = updateFacilityDto.numberOfStorageUnits;
      existingFacility.individualCapacityPerUnit = updateFacilityDto.individualCapacityPerUnit;
      existingFacility.totalCapacity = updateFacilityDto.totalCapacity;
      existingFacility.storageFacilitiesAppliedFor = updateFacilityDto.storageFacilitiesAppliedFor;
      existingFacility.produceForAccreditation = updateFacilityDto.produceForAccreditation;
      existingFacility.totalCapacityAppliedFor = updateFacilityDto.totalCapacityAppliedFor;
      existingFacility.plinthHeight = updateFacilityDto.plinthHeight;
      existingFacility.length = updateFacilityDto.length;
      existingFacility.width = updateFacilityDto.width;
      existingFacility.height = updateFacilityDto.height;
      existingFacility.ownership = updateFacilityDto.ownership;
      existingFacility.leaseDuration = updateFacilityDto.leaseDuration ?? null;
      existingFacility.borrowerCodeOfPropertyOwner = updateFacilityDto.borrowerCodeOfPropertyOwner ?? null;
      return facilityRepo.save(existingFacility);
    });
    
    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseLocationStatus.REJECTED) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for authorized signatory if it exists
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationLocationId: warehouseLocationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '1-facility-information',
            resourceId: existingFacility.id,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      await this.warehouseLocationService.trackWarehouseLocationResubmissionAndUpdateStatus(
        warehouseLocationId,
        '1-facility',
        existingFacility.id,
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: 'Facility updated successfully',
      facilityId: existingFacility.id,
      applicationId: warehouseLocationId,
    };
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
