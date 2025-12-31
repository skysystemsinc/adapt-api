import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WarehouseLocation,
  WarehouseLocationStatus,
} from '../warehouse-location/entities/warehouse-location.entity';
import {
  WarehouseOperatorApplicationRequest,
  WarehouseOperatorApplicationStatus,
} from '../warehouse/entities/warehouse-operator-application-request.entity';
import { Facility } from '../warehouse-location/facility/entities/facility.entity';
import { CompanyInformation } from '../warehouse/entities/company-information.entity';
import { WarehouseOperator } from '../warehouse/entities/warehouse-operator.entity';
import {
  WarehouseDocument,
  DocumentableType,
  CertificateDocumentType,
} from '../warehouse/entities/warehouse-document.entity';

@Injectable()
export class ApplicantService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
    @InjectRepository(WarehouseOperatorApplicationRequest)
    private readonly warehouseOperatorApplicationRequestRepository: Repository<WarehouseOperatorApplicationRequest>,
    @InjectRepository(WarehouseOperator)
    private readonly warehouseOperatorRepository: Repository<WarehouseOperator>,
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
    @InjectRepository(CompanyInformation)
    private readonly companyInformationRepository: Repository<CompanyInformation>,
    @InjectRepository(WarehouseDocument)
    private readonly warehouseDocumentRepository: Repository<WarehouseDocument>,
  ) {}

  async getStats(userId: string) {
    
    const allApprovedApplicationCount = await Promise.all([
      this.warehouseLocationRepository.count({
        where: {
          userId,
          status: WarehouseLocationStatus.APPROVED,
        },
      }),
      this.warehouseOperatorApplicationRequestRepository.count({
        where: {
          userId,
          status: WarehouseOperatorApplicationStatus.APPROVED,
        },
      }),
    ]).then(([locationCount, operatorCount]) => locationCount + operatorCount);

    const rejectedApplicationCount = await Promise.all([
      this.warehouseLocationRepository.count({
        where: {
          userId,
          status: WarehouseLocationStatus.REJECTED,
        },
      }),
      this.warehouseOperatorApplicationRequestRepository.count({
        where: {
          userId,
          status: WarehouseOperatorApplicationStatus.REJECTED,
        },
      }),
    ]).then(([locationCount, operatorCount]) => locationCount + operatorCount);
    const pendingApplicationCount = await Promise.all([
      this.warehouseLocationRepository.count({
        where: {
          userId,
          status: WarehouseLocationStatus.PENDING,
        },
      }),
      this.warehouseOperatorApplicationRequestRepository.count({
        where: {
          userId,
          status: WarehouseOperatorApplicationStatus.PENDING,
        },
      }),
    ]).then(([locationCount, operatorCount]) => locationCount + operatorCount);
    const allApplicationCount = await Promise.all([
      this.warehouseLocationRepository.count({
        where: {
          userId,
        },
      }),
      this.warehouseOperatorApplicationRequestRepository.count({
        where: {
          userId,
        },
      }),
    ]).then(([locationCount, operatorCount]) => locationCount + operatorCount);


    // Get the warehouse operator application request status (most recent one)
    const warehouseOperatorApplication =
      await this.warehouseOperatorApplicationRequestRepository.findOne({
        where: {
          userId,
        },
        order: {
          createdAt: 'DESC',
        },
        select: ['status'],
      });

    return {
      allApprovedApplicationCount,
      rejectedApplicationCount,
      pendingApplicationCount,
      allApplicationCount,
      warehouseOperatorApplicationStatus:
        warehouseOperatorApplication?.status || null,
    };
  }

  async getCertificate(userId: string) {
    const operatorCertificate = await this.warehouseOperatorRepository
      .createQueryBuilder('operator')
      .leftJoinAndMapOne(
        'operator.certificate',
        WarehouseDocument,
        'certificate',
        'certificate.documentableType = :docType AND certificate.documentableId = operator.id AND certificate.documentType = :certType',
        {
          docType: DocumentableType.WAREHOUSE_OPERATOR,
          certType: CertificateDocumentType.OPERATOR_CERTIFICATE,
        },
      )
      .leftJoinAndSelect('operator.application', 'application')
      .where('operator.userId = :userId', { userId })
      .orderBy('operator.createdAt', 'DESC')
      .select([
        'operator.id',
        'operator.applicationId',
        'application.id',
        'application.applicationId',
        'certificate',
      ])
      .getMany();

      const locationCertificate = await this.warehouseLocationRepository
      .createQueryBuilder('location')
      .leftJoinAndMapOne(
        'location.certificate',
        WarehouseDocument,
        'certificate',
        'certificate.documentableType = :docType AND certificate.documentableId = location.id AND certificate.documentType = :certType',
        {
          docType: DocumentableType.WAREHOUSE_LOCATION,
          certType: CertificateDocumentType.LOCATION_CERTIFICATE,
        },
      )
      .leftJoinAndSelect('location.facility', 'facility')
      .where('location.userId = :userId', { userId })
      .orderBy('location.createdAt', 'DESC')
      .select([
        'location.id',
        'location.applicationId',
        'location.status',
        'facility.id',
        'facility.facilityName',
        'certificate',
      ])
      .getMany();
      
      return  [...operatorCertificate, ...locationCertificate]
  }

  async getLocationCertificate(userId: string) {
    return this.warehouseLocationRepository
      .createQueryBuilder('location')
      .leftJoinAndMapOne(
        'location.certificate',
        WarehouseDocument,
        'certificate',
        'certificate.documentableType = :docType AND certificate.documentableId = location.id AND certificate.documentType = :certType',
        {
          docType: DocumentableType.WAREHOUSE_LOCATION,
          certType: CertificateDocumentType.LOCATION_CERTIFICATE,
        },
      )
      .leftJoinAndSelect('location.facility', 'facility')
      .where('location.userId = :userId', { userId })
      .orderBy('location.createdAt', 'DESC')
      .select([
        'location.id',
        'location.applicationId',
        'location.status',
        'facility.id',
        'facility.facilityName',
        'certificate',
      ])
      .getMany();
  }
 

  async getApplications(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    // Fetch all warehouse locations with facility name
    const [allWarehouseLocations, locationCount] = await this.warehouseLocationRepository.findAndCount({
      where: { userId },
      relations: ['facility'],
      order: { createdAt: 'DESC' },
      select: ['id', 'applicationId', 'status', 'createdAt'],
    });

    // Fetch all warehouse operator applications with company name
    const [allWarehouseOperators, operatorCount] = await this.warehouseOperatorApplicationRequestRepository.findAndCount({
      where: { userId },
      relations: ['companyInformation'],
      order: { createdAt: 'DESC' },
      select: ['id', 'applicationId', 'status', 'createdAt'],
    });

    // Transform warehouse locations
    const locationApplications = allWarehouseLocations.map((location) => ({
      id: location.id,
      code: location.applicationId,
      name: location.facility?.facilityName || 'N/A',
      status: location.status,
      createdAt: location.createdAt,
      type: 'location' as const,
    }));

    // Transform warehouse operators
    const operatorApplications = allWarehouseOperators.map((operator) => ({
      id: operator.id,
      code: operator.applicationId || 'N/A',
      name: operator.companyInformation?.companyName || 'N/A',
      status: operator.status,
      createdAt: operator.createdAt,
      type: 'operator' as const,
    }));

    // Combine and sort by createdAt (most recent first)
    const allApplications = [...locationApplications, ...operatorApplications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate the combined results
    const total = locationCount + operatorCount;
    const skip = (page - 1) * limit;
    const paginatedApplications = allApplications.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      data: paginatedApplications,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}
