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
import { Assignment } from '../warehouse/operator/assignment/entities/assignment.entity';
import { WarehouseOperatorLocation } from '../warehouse-operator-location/entities/warehouse-operator-location.entity';

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
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(WarehouseOperatorLocation)
    private readonly warehouseOperatorLocationRepository: Repository<WarehouseOperatorLocation>,
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
    const operatorCertificates = await this.warehouseOperatorRepository
      .createQueryBuilder('operator')
      .leftJoin(
        WarehouseDocument,
        'certificate',
        'certificate.documentableType = :docType AND certificate.documentableId = operator.id AND certificate.documentType = :certType',
        {
          docType: DocumentableType.WAREHOUSE_OPERATOR,
          certType: CertificateDocumentType.OPERATOR_CERTIFICATE,
        },
      )
      .leftJoin('operator.application', 'application')
      .where('operator.userId = :userId', { userId })
      .orderBy('operator.createdAt', 'DESC')
      .select('operator.id', 'id')
      .addSelect('operator.applicationId', 'applicationId')
      .addSelect('application.id', 'application_id')
      .addSelect('application.applicationId', 'application_applicationId')
      .addSelect('certificate.id', 'certificate_id')
      .addSelect('certificate.originalFileName', 'certificate_originalFileName')
      .addSelect('certificate.filePath', 'certificate_filePath')
      .addSelect('certificate.mimeType', 'certificate_mimeType')
      .addSelect('certificate.documentType', 'certificate_documentType')
      .addSelect('certificate.createdAt', 'certificate_createdAt')
      .addSelect("'operator'", 'type')
      .getRawMany();

    const locationCertificates = await this.warehouseOperatorLocationRepository
      .createQueryBuilder('location')
      .leftJoin(
        WarehouseDocument,
        'certificate',
        'certificate.documentableType = :docType AND certificate.documentableId = location.id AND certificate.documentType = :certType',

        {
          docType: DocumentableType.WAREHOUSE_OPERATOR_LOCATION,
          certType: CertificateDocumentType.OPERATOR_LOCATION_CERTIFICATE,
        },
      )
      .where('location.userId = :userId', { userId })
      .orderBy('location.createdAt', 'DESC')
      .select('location.id', 'id')
      .select('location.warehouseLocationId', 'warehouseLocationId')
      .addSelect('location.locationCode', 'applicationId')
      .addSelect('location.status', 'status')
      .addSelect('certificate.id', 'certificate_id')
      .addSelect('certificate.originalFileName', 'certificate_originalFileName')
      .addSelect('certificate.filePath', 'certificate_filePath')
      .addSelect('certificate.mimeType', 'certificate_mimeType')
      .addSelect('certificate.documentType', 'certificate_documentType')
      .addSelect('certificate.createdAt', 'certificate_createdAt')
      .addSelect("'location'", 'type')
      .getRawMany();

    return [...operatorCertificates, ...locationCertificates];
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
      select: {
        id: true,
        applicationId: true,
        status: true,
        createdAt: true,
        facility: {
          facilityName: true,
        },
      },
    });

    // Fetch all warehouse operator applications with company name
    const [allWarehouseOperators, operatorCount] = await this.warehouseOperatorApplicationRequestRepository.findAndCount({
      where: { userId },
      relations: ['authorizedSignatories'],
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        applicationId: true,
        status: true,
        createdAt: true,
        authorizedSignatories: {
          authorizedSignatoryName: true,
        },
      },
    });

    // Get all IDs for batch assignment check
    const locationIds = allWarehouseLocations.map(loc => loc.id);
    const operatorIds = allWarehouseOperators.map(op => op.id);

    // Check for assignments - get first assignment ID per application
    const locationAssignments = locationIds.length > 0
      ? await this.assignmentRepository
          .createQueryBuilder('assignment')
          .select('assignment.id', 'id')
          .addSelect('assignment.applicationLocationId', 'applicationLocationId')
          .where('assignment.applicationLocationId IN (:...ids)', { ids: locationIds })
          .orderBy('assignment.createdAt', 'ASC')
          .getRawMany()
          .then(results => {
            // Get first assignment per application
            const assignmentMap = new Map<string, string>();
            results.forEach((row: any) => {
              if (!assignmentMap.has(row.applicationLocationId)) {
                assignmentMap.set(row.applicationLocationId, row.id);
              }
            });
            return Array.from(assignmentMap.entries()).map(([applicationLocationId, id]) => ({
              applicationLocationId,
              id,
            }));
          })
      : [];

    const operatorAssignments = operatorIds.length > 0
      ? await this.assignmentRepository
          .createQueryBuilder('assignment')
          .select('assignment.id', 'id')
          .addSelect('assignment.applicationId', 'applicationId')
          .where('assignment.applicationId IN (:...ids)', { ids: operatorIds })
          .orderBy('assignment.createdAt', 'ASC')
          .getRawMany()
          .then(results => {
            // Get first assignment per application
            const assignmentMap = new Map<string, string>();
            results.forEach((row: any) => {
              if (!assignmentMap.has(row.applicationId)) {
                assignmentMap.set(row.applicationId, row.id);
              }
            });
            return Array.from(assignmentMap.entries()).map(([applicationId, id]) => ({
              applicationId,
              id,
            }));
          })
      : [];

    // Create maps for quick lookup (applicationId -> assignmentId)
    const locationAssignmentMap = new Map<string, string>();
    locationAssignments.forEach(a => {
      if (a.applicationLocationId) {
        locationAssignmentMap.set(a.applicationLocationId, a.id);
      }
    });

    const operatorAssignmentMap = new Map<string, string>();
    operatorAssignments.forEach(a => {
      if (a.applicationId) {
        operatorAssignmentMap.set(a.applicationId, a.id);
      }
    });

    // Transform warehouse locations
    const locationApplications = allWarehouseLocations.map((location) => {
      const assignmentId = locationAssignmentMap.get(location.id) || null;

      return {
        id: location.id,
        code: location.applicationId,
        name: location.facility?.facilityName || 'N/A',
        status: location.status,
        assignmentId,
        createdAt: location.createdAt,
        type: 'location' as const,
      };
    });

    // Transform warehouse operators
    const operatorApplications = allWarehouseOperators.map((operator) => {
      const assignmentId = operatorAssignmentMap.get(operator.id) || null;

      return {
        id: operator.id,
        code: operator.applicationId || 'N/A',
        name: operator.authorizedSignatories[0].authorizedSignatoryName || 'N/A',
        status: operator.status,
        assignmentId,
        createdAt: operator.createdAt,
        type: 'operator' as const,
      };
    });

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
