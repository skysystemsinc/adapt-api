import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';
import { ContactHistory } from './entities/contact-history.entity';
import { Assignment, AssignmentLevel, AssignmentStatus } from '../../warehouse/operator/assignment/entities/assignment.entity';
import { AssignmentSection } from '../../warehouse/operator/assignment/entities/assignment-section.entity';
import { WarehouseService } from '../../warehouse/warehouse.service';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
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
   * Get contact by warehouse location ID
   */
  async findByWarehouseLocationId(warehouseLocationId: string, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    const contact = await this.contactRepository.findOne({
      where: { warehouseLocationId },
    });

    if (!contact) {
      return null;
    }

    // Map entity field to DTO field for frontend
    return {
      ...contact,
      facilityContactPerson: contact.name, // Map 'name' to 'facilityContactPerson' for frontend
    };
  }

  /**
   * Create or update contact by warehouse location ID
   */
  async create(warehouseLocationId: string, createContactDto: CreateContactDto, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Contact can only be added while application is in draft status');
    }

    const existingContact = await this.contactRepository.findOne({
      where: { warehouseLocationId },
    });

    if (existingContact) {
      // Map DTO field to entity field
      existingContact.name = createContactDto.facilityContactPerson;
      existingContact.email = createContactDto.email;
      existingContact.phoneNumber = createContactDto.phoneNumber;
      existingContact.mobileNumber = createContactDto.mobileNumber;
      return this.contactRepository.save(existingContact);
    }

    const contact = this.contactRepository.create({
      warehouseLocationId,
      name: createContactDto.facilityContactPerson, // Map to 'name' column
      email: createContactDto.email,
      phoneNumber: createContactDto.phoneNumber,
      mobileNumber: createContactDto.mobileNumber,
    });

    const savedContact = await this.contactRepository.save(contact);

    await this.warehouseLocationRepository.update(warehouseLocationId, {
      contact: savedContact,
    });

    return savedContact;
  }

  /**
   * Update contact by warehouse location ID
   */
  async updateByWarehouseLocationId(
    warehouseLocationId: string,
    updateContactDto: CreateContactDto,
    userId: string
  ) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED].includes(warehouseLocation.status)) {
      throw new BadRequestException('Contact can only be updated while application is in draft status');
    }

    const existingContact = await this.contactRepository.findOne({
      where: { warehouseLocationId },
    });

    if (!existingContact) {
      throw new NotFoundException('Contact not found for this application');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const contactRepo = manager.getRepository(Contact);
      const contactHistoryRepo = manager.getRepository(ContactHistory);

      if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED].includes(warehouseLocation.status)) {
        throw new BadRequestException('Contact can only be updated while application is in draft status');
      };

      if (warehouseLocation.status === WarehouseLocationStatus.REJECTED) {
        // Save history of contact if application is rejected (before overwriting)
        const historyRecord = contactHistoryRepo.create({
          contactId: existingContact.id,
          warehouseLocationId,
          name: existingContact.name,
          email: existingContact.email,
          phoneNumber: existingContact.phoneNumber,
          mobileNumber: existingContact.mobileNumber,
          isActive: false,
        });
        historyRecord.createdAt = existingContact.createdAt;
        await contactHistoryRepo.save(historyRecord);
      }

      // Overwrite existing contact with new information
      existingContact.name = updateContactDto.facilityContactPerson;
      existingContact.email = updateContactDto.email;
      existingContact.phoneNumber = updateContactDto.phoneNumber;
      existingContact.mobileNumber = updateContactDto.mobileNumber;

      return contactRepo.save(existingContact);
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
            sectionType: '2-contact-information',
            resourceId: existingContact.id,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      await this.warehouseService['trackResubmissionAndUpdateStatus'](
        warehouseLocationId,
        '2-contact-information',
        existingContact.id,
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: 'Contact updated successfully',
      contactId: existingContact.id,
      applicationId: warehouseLocationId,
    };

  }

  findAll() {
    return `This action returns all contacts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} contact`;
  }

  update(id: number, updateContactDto: UpdateContactDto) {
    return `This action updates a #${id} contact`;
  }

  remove(id: number) {
    return `This action removes a #${id} contact`;
  }
}
