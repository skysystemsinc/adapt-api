import { Controller, Get, Param } from '@nestjs/common';
import { AcademicQualificationService } from './academic-qualification.service';

@Controller('academic-qualification')
export class AcademicQualificationController {
  constructor(private readonly academicQualificationService: AcademicQualificationService) {}

  @Get()
  findAll() {
    return this.academicQualificationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.academicQualificationService.findOne(+id);
  }
}
