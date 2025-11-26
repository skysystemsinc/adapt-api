import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AssessmentDocumentsService } from './assessment-documents.service';
import { CreateAssessmentDocumentDto } from './dto/create-assessment-document.dto';
import { UpdateAssessmentDocumentDto } from './dto/update-assessment-document.dto';

@Controller('assessment-documents')
export class AssessmentDocumentsController {
  constructor(private readonly assessmentDocumentsService: AssessmentDocumentsService) {}

  @Post()
  create(@Body() createAssessmentDocumentDto: CreateAssessmentDocumentDto) {
    return this.assessmentDocumentsService.create(createAssessmentDocumentDto);
  }

  @Get()
  findAll() {
    return this.assessmentDocumentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assessmentDocumentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssessmentDocumentDto: UpdateAssessmentDocumentDto) {
    return this.assessmentDocumentsService.update(+id, updateAssessmentDocumentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assessmentDocumentsService.remove(+id);
  }
}
