import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AcademicQualificationService } from './academic-qualification.service';
import { CreateAcademicQualificationDto } from './dto/create-academic-qualification.dto';
import { UpdateAcademicQualificationDto } from './dto/update-academic-qualification.dto';

@Controller('academic-qualification')
export class AcademicQualificationController {
  constructor(private readonly academicQualificationService: AcademicQualificationService) {}

  @Post()
  create(@Body() createAcademicQualificationDto: CreateAcademicQualificationDto) {
    return this.academicQualificationService.create(createAcademicQualificationDto);
  }

  @Get()
  findAll() {
    return this.academicQualificationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.academicQualificationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAcademicQualificationDto: UpdateAcademicQualificationDto) {
    return this.academicQualificationService.update(+id, updateAcademicQualificationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.academicQualificationService.remove(+id);
  }
}
