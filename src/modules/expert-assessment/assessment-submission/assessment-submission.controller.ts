import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AssessmentSubmissionService } from './assessment-submission.service';
import { CreateAssessmentSubmissionDto } from './dto/create-assessment-submission.dto';
import { UpdateAssessmentSubmissionDto } from './dto/update-assessment-submission.dto';

@Controller('assessment-submission')
export class AssessmentSubmissionController {
  constructor(private readonly assessmentSubmissionService: AssessmentSubmissionService) {}

  @Post()
  create(@Body() createAssessmentSubmissionDto: CreateAssessmentSubmissionDto) {
    return this.assessmentSubmissionService.create(createAssessmentSubmissionDto);
  }

  @Get()
  findAll() {
    return this.assessmentSubmissionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assessmentSubmissionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssessmentSubmissionDto: UpdateAssessmentSubmissionDto) {
    return this.assessmentSubmissionService.update(+id, updateAssessmentSubmissionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assessmentSubmissionService.remove(+id);
  }
}
