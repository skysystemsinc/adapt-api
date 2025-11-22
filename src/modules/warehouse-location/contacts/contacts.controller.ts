import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('warehouse-location')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // Warehouse Location Contact endpoints
  @Get(':id/contact')
  @UseGuards(JwtAuthGuard)
  async getContact(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.contactsService.findByWarehouseLocationId(id, userId);
  }

  @Post(':id/contact')
  @UseGuards(JwtAuthGuard)
  async createContact(
    @Param('id') id: string,
    @Body() createContactDto: CreateContactDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.contactsService.create(id, createContactDto, userId);
  }

  @Patch(':id/contact')
  @UseGuards(JwtAuthGuard)
  async updateContact(
    @Param('id') id: string,
    @Body() updateContactDto: CreateContactDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.contactsService.updateByWarehouseLocationId(id, updateContactDto, userId);
  }

  // Legacy endpoints (kept for backward compatibility)
  @Post('contacts')
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create('', createContactDto, '');
  }

  @Get('contacts')
  findAll() {
    return this.contactsService.findAll();
  }

  @Get('contacts/:id')
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(+id);
  }

  @Patch('contacts/:id')
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.contactsService.update(+id, updateContactDto);
  }

  @Delete('contacts/:id')
  remove(@Param('id') id: string) {
    return this.contactsService.remove(+id);
  }
}
