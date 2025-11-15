import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProfessionalQualificationService } from './professional-qualification.service';
import { CreateProfessionalQualificationDto } from './dto/create-professional-qualification.dto';
import { UpdateProfessionalQualificationDto } from './dto/update-professional-qualification.dto';

@Controller('professional-qualification')
export class ProfessionalQualificationController {
  constructor(private readonly professionalQualificationService: ProfessionalQualificationService) {}

  @Post()
  create(@Body() createProfessionalQualificationDto: CreateProfessionalQualificationDto) {
    return this.professionalQualificationService.create(createProfessionalQualificationDto);
  }

  @Get()
  findAll() {
    return this.professionalQualificationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.professionalQualificationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProfessionalQualificationDto: UpdateProfessionalQualificationDto) {
    return this.professionalQualificationService.update(+id, updateProfessionalQualificationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.professionalQualificationService.remove(+id);
  }
}
