import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CreateFireSafetyDto } from './dto/create-fire-safety.dto';
import { UpdateFireSafetyDto } from './dto/update-fire-safety.dto';
import { FireSafety } from './entities/fire-safety.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';
import { WarehouseLocationService } from '../warehouse-location.service';
import { AssignmentSection } from '../../warehouse/operator/assignment/entities/assignment-section.entity';
import { Assignment, AssignmentLevel, AssignmentStatus } from '../../warehouse/operator/assignment/entities/assignment.entity';
import { FireSafetyHistory } from './entities/fire-safety-history.entity';

@Injectable()
export class FireSafetyService {
  constructor(
    @InjectRepository(FireSafety)
    private readonly fireSafetyRepository: Repository<FireSafety>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
    private readonly dataSource: DataSource,

    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,

    @InjectRepository(AssignmentSection)
    private readonly assignmentSectionRepository: Repository<AssignmentSection>,

    @Inject(forwardRef(() => WarehouseLocationService))
    private readonly warehouseLocationService: WarehouseLocationService,
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

    if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED, WarehouseLocationStatus.RESUBMITTED].includes(warehouseLocation.status)) {
      throw new BadRequestException('Fire safety can only be updated while application is in draft status');
    }

    const existingFireSafety = await this.fireSafetyRepository.findOne({
      where: { warehouseLocationId },
    });

    if (!existingFireSafety) {
      throw new NotFoundException('Fire safety not found for this application');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const fireSafetyRepo = manager.getRepository(FireSafety);
      const fireSafetyHistoryRepo = manager.getRepository(FireSafetyHistory);

      if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED, WarehouseLocationStatus.RESUBMITTED].includes(warehouseLocation.status)) {
        throw new BadRequestException('Security can only be updated while application is in draft or rejected status');
      };

      if (warehouseLocation.status === WarehouseLocationStatus.REJECTED) {
        // Save history of security if application is rejected (before overwriting)
        const historyRecord = fireSafetyHistoryRepo.create({
          fireSafetyId: existingFireSafety.id,
          warehouseLocationId,
          fireExtinguishers: existingFireSafety.fireExtinguishers,
          fireBuckets: existingFireSafety.fireBuckets,
          waterArrangements: existingFireSafety.waterArrangements,
          fireSafetyAlarms: existingFireSafety.fireSafetyAlarms,
          otherFireSafetyMeasures: existingFireSafety.otherFireSafetyMeasures,
          isActive: false,
        });
        historyRecord.createdAt = existingFireSafety.createdAt;
        await fireSafetyHistoryRepo.save(historyRecord);
      }

      // Overwrite existing security with new information
      existingFireSafety.fireExtinguishers = updateFireSafetyDto.fireExtinguishers;
      existingFireSafety.fireBuckets = updateFireSafetyDto.fireBuckets;
      existingFireSafety.waterArrangements = updateFireSafetyDto.waterArrangements;
      existingFireSafety.fireSafetyAlarms = updateFireSafetyDto.fireSafetyAlarms;
      existingFireSafety.otherFireSafetyMeasures = updateFireSafetyDto.otherFireSafetyMeasures ?? '';

      return fireSafetyRepo.save(existingFireSafety);
    });

    const updatedApplication = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId },
    });

    if (updatedApplication?.status === WarehouseLocationStatus.REJECTED) {
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
            sectionType: '4-security-fire-safety',
            resourceId: existingFireSafety.id,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      await this.warehouseLocationService.trackWarehouseLocationResubmissionAndUpdateStatus(
        warehouseLocationId,
        '4-security-fire-safety',
        existingFireSafety.id,
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: 'Fire safety updated successfully',
      fireSafetyId: existingFireSafety.id,
      applicationId: warehouseLocationId,
    };

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
