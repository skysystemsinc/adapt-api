import { Controller, Get, Param } from '@nestjs/common';
import { ProfessionalExperienceService } from './professional-experience.service';

@Controller('professional-experience')
export class ProfessionalExperienceController {
  constructor(private readonly professionalExperienceService: ProfessionalExperienceService) {}

  @Get()
  findAll() {
    return this.professionalExperienceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.professionalExperienceService.findOne(+id);
  }
}
