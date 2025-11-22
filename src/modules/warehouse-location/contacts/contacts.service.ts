import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
  ) {}

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

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Contact can only be updated while application is in draft status');
    }

    const contact = await this.contactRepository.findOne({
      where: { warehouseLocationId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found for this application');
    }

    // Map DTO field to entity field
    contact.name = updateContactDto.facilityContactPerson;
    contact.email = updateContactDto.email;
    contact.phoneNumber = updateContactDto.phoneNumber;
    contact.mobileNumber = updateContactDto.mobileNumber;
    return this.contactRepository.save(contact);
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
