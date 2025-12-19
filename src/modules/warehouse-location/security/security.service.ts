import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CreateSecurityDto } from './dto/create-security.dto';
import { UpdateSecurityDto } from './dto/update-security.dto';
import { Security } from './entities/security.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';
import { WarehouseService } from '../../warehouse/warehouse.service';
import { AssignmentSection } from '../../warehouse/operator/assignment/entities/assignment-section.entity';
import { Assignment, AssignmentLevel, AssignmentStatus } from '../../warehouse/operator/assignment/entities/assignment.entity';
import { SecurityHistory } from './entities/security-history.entity';

@Injectable()
export class SecurityService {
  constructor(
    @InjectRepository(Security)
    private readonly securityRepository: Repository<Security>,
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

    if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED, WarehouseLocationStatus.RESUBMITTED].includes(warehouseLocation.status)) {
      throw new BadRequestException('Security can only be updated while application is in draft status');
    }

    const existingSecurity = await this.securityRepository.findOne({
      where: { warehouseLocationId },
    });

    if (!existingSecurity) {
      throw new NotFoundException('Security not found for this application');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const securityRepo = manager.getRepository(Security);
      const securityHistoryRepo = manager.getRepository(SecurityHistory);

      if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED, WarehouseLocationStatus.RESUBMITTED].includes(warehouseLocation.status)) {
        throw new BadRequestException('Security can only be updated while application is in draft or rejected status');
      };

      if (warehouseLocation.status === WarehouseLocationStatus.REJECTED) {
        // Save history of security if application is rejected (before overwriting)
        const historyRecord = securityHistoryRepo.create({
          securityId: existingSecurity.id,
          warehouseLocationId,
          guardsDeployed: existingSecurity.guardsDeployed,
          NumberOfCameras: existingSecurity.NumberOfCameras,
          otherSecurityMeasures: existingSecurity.otherSecurityMeasures,
          isActive: false,
        });
        historyRecord.createdAt = existingSecurity.createdAt;
        await securityHistoryRepo.save(historyRecord);
      }

      // Overwrite existing security with new information
      existingSecurity.guardsDeployed = updateSecurityDto.guardsDeployed;
      existingSecurity.NumberOfCameras = updateSecurityDto.NumberOfCameras;
      existingSecurity.otherSecurityMeasures = updateSecurityDto.otherSecurityMeasures;

      return securityRepo.save(existingSecurity);
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
            resourceId: existingSecurity.id,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      await this.warehouseService['trackResubmissionAndUpdateStatus'](
        warehouseLocationId,
        '4-security-fire-safety',
        existingSecurity.id,
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: 'Security updated successfully',
      securityId: existingSecurity.id,
      applicationId: warehouseLocationId,
    };

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
