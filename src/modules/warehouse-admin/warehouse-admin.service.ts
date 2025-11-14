import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWarehouseAdminDto } from './dto/create-warehouse-admin.dto';
import { UpdateWarehouseAdminDto } from './dto/update-warehouse-admin.dto';
import { QueryOperatorApplicationDto } from './dto/query-operator-application.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { WarehouseOperatorApplicationRequest, WarehouseOperatorApplicationStatus } from '../warehouse/entities/warehouse-operator-application-request.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WarehouseAdminService {

  constructor(
    @InjectRepository(WarehouseOperatorApplicationRequest)
    private warehouseOperatorApplicationRequestRepository: Repository<WarehouseOperatorApplicationRequest>,
  ) { }

  async findAllWareHouseOperatorsPaginated(query: QueryOperatorApplicationDto) {
    const { page = 1, status, search, limit = 10, sortBy = 'createdAt', sortOrder = 'ASC' } = query;

    const queryBuilder = this.warehouseOperatorApplicationRequestRepository
      .createQueryBuilder('application')
      .leftJoin('application.user', 'user')
      .select([
        'application.id',
        'application.applicationId',
        'application.applicationType',
        'application.status',
        'application.createdAt',
        'application.updatedAt',
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
      ]);

    if (status) {
      queryBuilder.andWhere('application.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere('user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search', { search: `%${search}%` });
    }

    // Sorting
    queryBuilder.orderBy(`application.${sortBy}`, sortOrder);
    // Also order details by createdAt to maintain consistent order
    queryBuilder.addOrderBy('application.createdAt', 'ASC');

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    // const firstPendingId = await this.getFirstPendingApplicationId();
    // const enrichedData = data.map((app) =>
    //   this.enrichApplicationWithCalculatedFields(app, firstPendingId)
    // );

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async getFirstPendingApplicationId(): Promise<string | null> {
    const firstPending = await this.warehouseOperatorApplicationRequestRepository.findOne({
      where: { status: WarehouseOperatorApplicationStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
    return firstPending?.id || null;
  }

  create(createWarehouseAdminDto: CreateWarehouseAdminDto) {
    return 'This action adds a new warehouseAdmin';
  }

  findAll() {
    return `This action returns all warehouseAdmin`;
  }

  async findOne(id: string) {
    const warehouseOperatorApplication = await this.warehouseOperatorApplicationRequestRepository.findOne({
      where: { id },
      select: {
        id: true,
        status: true,
        applicationId: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        },
        companyInformation: {
          id: true,
          companyName: true,
        },
        financialInformation: {
          id: true,
          auditReport: {
            id: true,
            documentType: true,
            documentName: true,
            periodStart: true,
            periodEnd: true,
          },
          taxReturns: {
            id: true,
            documentType: true,
            documentName: true,
            periodStart: true,
            periodEnd: true,
          },
          bankStatements: {
            id: true,
            documentType: true,
            documentName: true,
            periodStart: true,
            periodEnd: true,
          },
        },
        bankDetails: {
          id: true,
          name: true,
        },
        authorizedSignatories: {
          id: true,
          name: true,
        },
        hrs: {
          id: true,
          personalDetails: {
            id: true,
            name: true,
            email: true
          }
        },
        applicantChecklist: {
          id: true,
          humanResources: {
            id: true,
            qcPersonnel: true,
            qcPersonnelFile: true,
          },
        },
      },
      relations: {
        user: true,
        authorizedSignatories: true,
        companyInformation: true,
        bankDetails: true,
        hrs: {
          personalDetails: true
        },
        financialInformation: {
          auditReport: true,
          taxReturns: true,
          bankStatements: true,
        },
        applicantChecklist: true,
      }
    });

    if (!warehouseOperatorApplication) {
      throw new NotFoundException('Warehouse operator application not found');
    }

    const totalCount =
      (warehouseOperatorApplication.authorizedSignatories?.length || 0) +
      (warehouseOperatorApplication.hrs?.length || 0) +
      (warehouseOperatorApplication.financialInformation?.auditReport ? 1 : 0) +
      (warehouseOperatorApplication.financialInformation?.taxReturns ? 1 : 0) +
      (warehouseOperatorApplication.financialInformation?.bankStatements ? 1 : 0) +
      (warehouseOperatorApplication.companyInformation ? 1 : 0) +
      (warehouseOperatorApplication.bankDetails ? 1 : 0) +
      (warehouseOperatorApplication.applicantChecklist ? 1 : 0);

    return {
      ...warehouseOperatorApplication,
      totalCount,
    };
  }

  update(id: number, updateWarehouseAdminDto: UpdateWarehouseAdminDto) {
    return `This action updates a #${id} warehouseAdmin`;
  }

  remove(id: number) {
    return `This action removes a #${id} warehouseAdmin`;
  }
}
