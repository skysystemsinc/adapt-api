import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizedSignatoryDto, CreateBankDetailsDto, CreateWarehouseOperatorApplicationRequestDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { Repository } from 'typeorm';
import { WarehouseOperatorApplicationRequest, WarehouseOperatorApplicationStatus } from './entities/warehouse-operator-application-request.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthorizedSignatory } from './entities/authorized-signatories.entity';
import { StepStatus } from './entities/bank-details.entity';
import { BankDetails } from './entities/bank-details.entity';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(WarehouseOperatorApplicationRequest)
    private readonly warehouseOperatorRepository: Repository<WarehouseOperatorApplicationRequest>,
    @InjectRepository(AuthorizedSignatory)
    private readonly authorizedSignatoryRepository: Repository<AuthorizedSignatory>,
    @InjectRepository(BankDetails)
    private readonly bankDetailsRepository: Repository<BankDetails>
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

  async createBankDetails(applicationId: string, createBankDetailsDto: CreateBankDetailsDto, userId: string) {
    const application = await this.warehouseOperatorRepository.findOne({ where: { id: applicationId, userId } });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // only allow updating after application is either new or resubmitted or rejected
    if(application.status === WarehouseOperatorApplicationStatus.DRAFT) {
      throw new BadRequestException('Cannot Add new Bank Details. Bank Details can only be updated.');
    }

    if (
      ![WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED]
        .includes(application.status)
    ) {
      throw new BadRequestException('Cannot update bank details after application is submitted');
    }

    const bankDetails = this.bankDetailsRepository.create({
      applicationId: application.id,
      name: createBankDetailsDto.accountTitle,
      accountTitle: createBankDetailsDto.accountTitle,
      iban: createBankDetailsDto.iban,
      accountType: createBankDetailsDto.accountType,
      branchAddress: createBankDetailsDto.branchAddress,
      status: StepStatus.DRAFT,
    });

    await this.bankDetailsRepository.save(bankDetails);

    return {
      message: 'Bank details saved successfully',
      bankDetailsId: bankDetails.id,
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
