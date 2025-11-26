import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AssessmentSubSectionService } from './assessment-sub-section.service';
import { CreateAssessmentSubSectionDto } from './dto/create-assessment-sub-section.dto';
import { UpdateAssessmentSubSectionDto } from './dto/update-assessment-sub-section.dto';
import { QueryAssessmentSubSectionDto } from './dto/query-assessment-sub-section.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AssessmentSubSection } from './entities/assessment-sub-section.entity';

@ApiTags('Assessment Sub-Section')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('assessment-sub-section')
export class AssessmentSubSectionController {
  constructor(private readonly assessmentSubSectionService: AssessmentSubSectionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new assessment sub-section' })
  @ApiResponse({ status: 201, description: 'Assessment sub-section created successfully', type: AssessmentSubSection })
  @ApiResponse({ status: 404, description: 'Parent expert assessment not found' })
  async create(@Body() createAssessmentSubSectionDto: CreateAssessmentSubSectionDto): Promise<AssessmentSubSection> {
    return this.assessmentSubSectionService.create(createAssessmentSubSectionDto);
  }

  @Get('assessment/:assessmentId')
  @ApiOperation({ summary: 'Get all sub-sections for a specific assessment with pagination' })
  @ApiParam({ name: 'assessmentId', description: 'Expert assessment ID' })
  @ApiResponse({ status: 200, description: 'Paginated list of assessment sub-sections' })
  @ApiResponse({ status: 404, description: 'Expert assessment not found' })
  async findByAssessmentId(
    @Param('assessmentId') assessmentId: string,
    @Query() query: QueryAssessmentSubSectionDto,
  ) {
    return this.assessmentSubSectionService.findByAssessmentId(assessmentId, query);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assessment sub-sections with pagination' })
  @ApiResponse({ status: 200, description: 'List of assessment sub-sections' })
  async findAll(@Query() query: QueryAssessmentSubSectionDto) {
    return this.assessmentSubSectionService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single assessment sub-section by ID' })
  @ApiResponse({ status: 200, description: 'Assessment sub-section details', type: AssessmentSubSection })
  @ApiResponse({ status: 404, description: 'Assessment sub-section not found' })
  async findOne(@Param('id') id: string): Promise<AssessmentSubSection> {
    return this.assessmentSubSectionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an assessment sub-section' })
  @ApiResponse({ status: 200, description: 'Assessment sub-section updated successfully', type: AssessmentSubSection })
  @ApiResponse({ status: 404, description: 'Assessment sub-section not found' })
  async update(
    @Param('id') id: string,
    @Body() updateAssessmentSubSectionDto: UpdateAssessmentSubSectionDto,
  ): Promise<AssessmentSubSection> {
    return this.assessmentSubSectionService.update(id, updateAssessmentSubSectionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an assessment sub-section' })
  @ApiResponse({ status: 200, description: 'Assessment sub-section deleted successfully' })
  @ApiResponse({ status: 404, description: 'Assessment sub-section not found' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.assessmentSubSectionService.remove(id);
    return { message: 'Assessment sub-section deleted successfully' };
  }
}
