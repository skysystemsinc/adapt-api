import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizedSignatoryDto, CreateWarehouseOperatorApplicationRequestDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { Repository } from 'typeorm';
import { WarehouseOperatorApplicationRequest, WarehouseOperatorApplicationStatus } from './entities/warehouse-operator-application-request.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthorizedSignatory } from './entities/authorized-signatories.entity';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(WarehouseOperatorApplicationRequest)
    private readonly warehouseOperatorRepository: Repository<WarehouseOperatorApplicationRequest>,
    @InjectRepository(AuthorizedSignatory)
    private readonly authorizedSignatoryRepository: Repository<AuthorizedSignatory>
  ) { }

  async createOperatorApplication(
    createWarehouseDto: CreateWarehouseOperatorApplicationRequestDto,
    userId: string
  ) {
    const application = await this.warehouseOperatorRepository.find({ where: { userId } });

    if (application && application.length > 0) {
      if (application[0].status === WarehouseOperatorApplicationStatus.DRAFT) {
        return {
          message: 'You are already a warehouse operator in draft status. Please update your application instead of creating a new one.',
        };
      } else if ([WarehouseOperatorApplicationStatus.IN_PROCESS,
      WarehouseOperatorApplicationStatus.PENDING,
      WarehouseOperatorApplicationStatus.APPROVED,
      WarehouseOperatorApplicationStatus.SUBMITTED
      ]
        .includes(application[0].status)) {
        return {
          message: 'Your warehouse operator application is being reviewed. Please contact the admin to update your application.',
        };
      }
    }

    const newApplication = this.warehouseOperatorRepository.create({
      applicationId: await this.generateApplicationId(),
      userId,
      status: WarehouseOperatorApplicationStatus.DRAFT
    });

    const warehouseOperatorApplication = await this.warehouseOperatorRepository.save(newApplication);

    const authorizedSignatories = createWarehouseDto.authorizedSignatories.map((authorizedSignatory: AuthorizedSignatoryDto) => {
      return this.authorizedSignatoryRepository.save({
        warehouseOperatorApplicationRequestId: warehouseOperatorApplication.id,
        authorizedSignatoryName: authorizedSignatory.authorizedSignatoryName,
        name: authorizedSignatory.name,
        cnic: authorizedSignatory.cnic.toString(),
        passport: authorizedSignatory.passport,
        issuanceDateOfCnic: authorizedSignatory.issuanceDateOfCnic,
        expiryDateOfCnic: authorizedSignatory.expiryDateOfCnic,
        mailingAddress: authorizedSignatory.mailingAddress,
        city: authorizedSignatory.city,
        country: authorizedSignatory.country,
        postalCode: authorizedSignatory.postalCode,
        designation: authorizedSignatory.designation,
        mobileNumber: authorizedSignatory.mobileNumber,
        email: authorizedSignatory.email,
        landlineNumber: authorizedSignatory.landlineNumber,
      });
    });

    await Promise.all(authorizedSignatories);

    return {
      message: 'Warehouse authorized signatories saved successfully',
      warehouseOperatorApplicationRequestId: warehouseOperatorApplication.applicationId,
    };
  }

  async findByUserId(userId: string) {
    return await this.warehouseOperatorRepository.find({ where: { userId } });
  }

  async generateApplicationId() {
    const count = await this.warehouseOperatorRepository.count();
    const applicationId = `WHO-${String(count + 1).padStart(6, '0')}`;
    return applicationId;
  }

  async findOneWarehouseOperator(userId: string) {
    const warehouseOperatorApplication = await this.warehouseOperatorRepository.findOne({
      where: {
        userId
      },
      relations: ['authorizedSignatories' as 'Authorized Signatory']
    });
    
    if (!warehouseOperatorApplication) {
      throw new NotFoundException('Warehouse operator application not found');
    }

    return warehouseOperatorApplication;
  }

  findAll() {
    return `This action returns all warehouse`;
  }

  findOne(id: number) {
    return `This action returns a #${id} warehouse`;
  }

  update(id: number, updateWarehouseDto: UpdateWarehouseDto) {
    return `This action updates a #${id} warehouse`;
  }

  remove(id: number) {
    return `This action removes a #${id} warehouse`;
  }
}
