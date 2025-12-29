import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateJurisdictionDto } from './dto/create-jurisdiction.dto';
import { UpdateJurisdictionDto } from './dto/update-jurisdiction.dto';
import { Jurisdiction } from './entities/jurisdiction.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';
import { DataSource } from 'typeorm';
import { JurisdictionHistory } from './entities/jurisdiction-history.entity';
import { Assignment, AssignmentLevel, AssignmentStatus } from 'src/modules/warehouse/operator/assignment/entities/assignment.entity';
import { AssignmentSection } from 'src/modules/warehouse/operator/assignment/entities/assignment-section.entity';
import { WarehouseLocationService } from '../warehouse-location.service';

@Injectable()
export class JurisdictionService {
  constructor(
    @InjectRepository(Jurisdiction)
    private readonly jurisdictionRepository: Repository<Jurisdiction>,
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

    if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED].includes(warehouseLocation.status)) {
      throw new BadRequestException('Jurisdiction can only be updated while application is in draft status');
    }

    const existingJurisdiction = await this.jurisdictionRepository.findOne({
      where: { warehouseLocationId },
    });

    if (!existingJurisdiction) {
      throw new NotFoundException('Jurisdiction not found for this application');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const jurisdictionRepo = manager.getRepository(Jurisdiction);
      const jurisdictionHistoryRepo = manager.getRepository(JurisdictionHistory);

      if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED].includes(warehouseLocation.status)) {
        throw new BadRequestException('Jurisdiction can only be updated while application is in draft status');
      };

      if (warehouseLocation.status === WarehouseLocationStatus.REJECTED) {
        // Save history of jurisdiction if application is rejected (before overwriting)
        const historyRecord = jurisdictionHistoryRepo.create({
          jurisdictionId: existingJurisdiction.id,
          warehouseLocationId,
          jurisdictionalPoliceStationName: existingJurisdiction.jurisdictionalPoliceStationName,
          policeStationDistance: existingJurisdiction.policeStationDistance,
          nearestFireStationName: existingJurisdiction.nearestFireStationName,
          fireStationDistance: existingJurisdiction.fireStationDistance,
          numberOfEntryAndExit: existingJurisdiction.numberOfEntryAndExit,
          compoundWallFencing: existingJurisdiction.compoundWallFencing,
          heightOfCompoundWall: existingJurisdiction.heightOfCompoundWall,
          compoundWallBarbedFencing: existingJurisdiction.compoundWallBarbedFencing,
          damageOnCompoundWall: existingJurisdiction.damageOnCompoundWall,
          isActive: false,
        });
        historyRecord.createdAt = existingJurisdiction.createdAt;
        await jurisdictionHistoryRepo.save(historyRecord);
      }

      // Overwrite existing jurisdiction with new information
      existingJurisdiction.jurisdictionalPoliceStationName = updateJurisdictionDto.jurisdictionalPoliceStationName;
      existingJurisdiction.policeStationDistance = updateJurisdictionDto.policeStationDistance;
      existingJurisdiction.nearestFireStationName = updateJurisdictionDto.nearestFireStationName;
      existingJurisdiction.fireStationDistance = updateJurisdictionDto.fireStationDistance;
      existingJurisdiction.numberOfEntryAndExit = updateJurisdictionDto.numberOfEntryAndExit;
      existingJurisdiction.compoundWallFencing = updateJurisdictionDto.compoundWallFencing;
      existingJurisdiction.heightOfCompoundWall = updateJurisdictionDto.heightOfCompoundWall;
      existingJurisdiction.compoundWallBarbedFencing = updateJurisdictionDto.compoundWallBarbedFencing;
      existingJurisdiction.damageOnCompoundWall = updateJurisdictionDto.damageOnCompoundWall;

      return jurisdictionRepo.save(existingJurisdiction);
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
            sectionType: '3-jurisdiction',
            resourceId: existingJurisdiction.id,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      await this.warehouseLocationService.trackWarehouseLocationResubmissionAndUpdateStatus(
        warehouseLocationId,
        '3-jurisdiction',
        existingJurisdiction.id,
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: 'Jurisdiction updated successfully',
      jurisdictionId: existingJurisdiction.id,
      applicationId: warehouseLocationId,
    };
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
