import { Controller, Get, Param } from '@nestjs/common';
import { ProfessionalQualificationService } from './professional-qualification.service';

@Controller('professional-qualification')
export class ProfessionalQualificationController {
  constructor(private readonly professionalQualificationService: ProfessionalQualificationService) {}

  @Get()
  findAll() {
    return this.professionalQualificationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.professionalQualificationService.findOne(+id);
  }
}
