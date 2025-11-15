import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProfessionalExperienceService } from './professional-experience.service';
import { CreateProfessionalExperienceDto } from './dto/create-professional-experience.dto';
import { UpdateProfessionalExperienceDto } from './dto/update-professional-experience.dto';

@Controller('professional-experience')
export class ProfessionalExperienceController {
  constructor(private readonly professionalExperienceService: ProfessionalExperienceService) {}

  @Post()
  create(@Body() createProfessionalExperienceDto: CreateProfessionalExperienceDto) {
    return this.professionalExperienceService.create(createProfessionalExperienceDto);
  }

  @Get()
  findAll() {
    return this.professionalExperienceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.professionalExperienceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProfessionalExperienceDto: UpdateProfessionalExperienceDto) {
    return this.professionalExperienceService.update(+id, updateProfessionalExperienceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.professionalExperienceService.remove(+id);
  }
}
