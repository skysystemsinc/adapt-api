import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateTechnicalQualitativeDto } from './dto/create-technical-qualitative.dto';
import { UpdateTechnicalQualitativeDto } from './dto/update-technical-qualitative.dto';
import { TechnicalQualitative } from './entities/technical-qualitative.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';
import { WarehouseService } from '../../warehouse/warehouse.service';
import { AssignmentSection } from '../../warehouse/operator/assignment/entities/assignment-section.entity';
import { Assignment, AssignmentLevel, AssignmentStatus } from '../../warehouse/operator/assignment/entities/assignment.entity';
import { In } from 'typeorm';
import { TechnicalQualitativeHistory } from './entities/technical-qualitative-history.entity';

@Injectable()
export class TechnicalQualitativeService {
  constructor(
    @InjectRepository(TechnicalQualitative)
    private readonly technicalQualitativeRepository: Repository<TechnicalQualitative>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
    private readonly dataSource: DataSource,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(AssignmentSection)
    private readonly assignmentSectionRepository: Repository<AssignmentSection>,
    @Inject(forwardRef(() => WarehouseService))
    private readonly warehouseService: WarehouseService,
  ) { }

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

    if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED, WarehouseLocationStatus.RESUBMITTED].includes(warehouseLocation.status)) {
      throw new BadRequestException('Technical qualitative can only be updated while application is in draft status');
    }

    const existingTechnicalQualitative = await this.technicalQualitativeRepository.findOne({
      where: { warehouseLocationId },
    });

    if (!existingTechnicalQualitative) {
      throw new NotFoundException('Technical qualitative not found for this application');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const technicalQualitativeRepo = manager.getRepository(TechnicalQualitative);
      const technicalQualitativeHistoryRepo = manager.getRepository(TechnicalQualitativeHistory);

      if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED].includes(warehouseLocation.status)) {
        throw new BadRequestException('Cannot update technical qualitative after application is approved or submitted');
      }

      if (warehouseLocation.status === WarehouseLocationStatus.REJECTED) {
        // Save history of technical qualitative if application is rejected (before overwriting)
        const historyRecord = technicalQualitativeHistoryRepo.create({
          technicalQualitativeId: existingTechnicalQualitative.id,
          warehouseLocationId,
          laboratoryFacility: existingTechnicalQualitative.laboratoryFacility,
          minimumLabEquipmentExist: existingTechnicalQualitative.minimumLabEquipmentExist,
          equipmentCalibrated: existingTechnicalQualitative.equipmentCalibrated,
          washroomsExist: existingTechnicalQualitative.washroomsExist,
          waterAvailability: existingTechnicalQualitative.waterAvailability,
          officeInternetFacility: existingTechnicalQualitative.officeInternetFacility,
          electricityAvailable: existingTechnicalQualitative.electricityAvailable,
          gasAvailable: existingTechnicalQualitative.gasAvailable,
          generatorAvailable: existingTechnicalQualitative.generatorAvailable,
          otherUtilitiesFacilities: existingTechnicalQualitative.otherUtilitiesFacilities ?? undefined,
          isActive: false,
        });
        historyRecord.createdAt = existingTechnicalQualitative.createdAt;
        await technicalQualitativeHistoryRepo.save(historyRecord);
      }

      // Overwrite existing technical qualitative with new information
      existingTechnicalQualitative.laboratoryFacility = updateTechnicalQualitativeDto.laboratoryFacility ?? false;
      existingTechnicalQualitative.minimumLabEquipmentExist = updateTechnicalQualitativeDto.minimumLabEquipmentExist ?? false;
      existingTechnicalQualitative.equipmentCalibrated = updateTechnicalQualitativeDto.equipmentCalibrated ?? false;
      existingTechnicalQualitative.washroomsExist = updateTechnicalQualitativeDto.washroomsExist ?? false;
      existingTechnicalQualitative.waterAvailability = updateTechnicalQualitativeDto.waterAvailability ?? false;
      existingTechnicalQualitative.officeInternetFacility = updateTechnicalQualitativeDto.officeInternetFacility ?? false;
      existingTechnicalQualitative.electricityAvailable = updateTechnicalQualitativeDto.electricityAvailable ?? false;
      existingTechnicalQualitative.gasAvailable = updateTechnicalQualitativeDto.gasAvailable ?? false;
      existingTechnicalQualitative.generatorAvailable = updateTechnicalQualitativeDto.generatorAvailable ?? false;
      existingTechnicalQualitative.otherUtilitiesFacilities = updateTechnicalQualitativeDto.otherUtilitiesFacilities ?? undefined;
      return technicalQualitativeRepo.save(existingTechnicalQualitative);
    });

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId },
    });

    if (updatedApplication?.status === WarehouseLocationStatus.REJECTED) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for authorized signatory if it exists
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationLocationId: warehouseLocationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        }
      });
      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        const assignmentSections = await this.assignmentSectionRepository.find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '2-technical-qualitative',
            resourceId: existingTechnicalQualitative.id,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      await this.warehouseService['trackResubmissionAndUpdateStatus'](
        warehouseLocationId,
        '6-technical-qualitative',
        existingTechnicalQualitative.id,
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: 'Technical qualitative updated successfully',
      technicalQualitativeId: existingTechnicalQualitative.id,
      applicationId: warehouseLocationId,
    };
  }
}