import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExpertAssessmentService } from './expert-assessment.service';
import { CreateExpertAssessmentDto } from './dto/create-expert-assessment.dto';
import { UpdateExpertAssessmentDto } from './dto/update-expert-assessment.dto';
import { QueryExpertAssessmentDto } from './dto/query-expert-assessment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExpertAssessment } from './entities/expert-assessment.entity';

@ApiTags('Expert Assessment')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('expert-assessment')
export class ExpertAssessmentController {
  constructor(private readonly expertAssessmentService: ExpertAssessmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expert assessment' })
  @ApiResponse({ status: 201, description: 'Expert assessment created successfully', type: ExpertAssessment })
  @ApiResponse({ status: 409, description: 'Expert assessment with this name already exists' })
  async create(
    @Body() createExpertAssessmentDto: CreateExpertAssessmentDto,
    @Request() req: any,
  ): Promise<ExpertAssessment> {
    const userId = req.user?.sub;
    return this.expertAssessmentService.create(createExpertAssessmentDto, userId);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all expert assessments with pagination' })
  @ApiResponse({ status: 200, description: 'List of expert assessments' })
  async findAllExpertAssessments(@Query() query: QueryExpertAssessmentDto) {
    return this.expertAssessmentService.findAll(query);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get expert assessments by category with pagination' })
  @ApiResponse({ status: 200, description: 'List of expert assessments for the category' })
  async findByCategory(
    @Param('category') category: string,
    @Query() query: QueryExpertAssessmentDto,
  ) {
    return this.expertAssessmentService.findByCategory(category, query);
  }

  @Get('by-category/:category')
  @ApiOperation({ 
    summary: 'Get expert assessments by category with sub-sections (optimized single query)',
    description: 'Highly optimized endpoint that returns assessments with their sub-sections in a single database query. Use this for inspection forms.'
  })
  @ApiQuery({ 
    name: 'includeSubSections', 
    required: false, 
    type: Boolean,
    description: 'Whether to include sub-sections in the response (default: true)'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Maximum number of results (default: 100)'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: 'Page number (default: 1)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of expert assessments with sub-sections for the category',
    type: [ExpertAssessment]
  })
  async findByCategoryWithSubSections(
    @Param('category') category: string,
    @Query('includeSubSections') includeSubSections?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const includeSubSectionsBool = includeSubSections !== 'false'; // Default to true
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const pageNum = page ? parseInt(page, 10) : 1;

    return this.expertAssessmentService.findByCategoryWithSubSections(
      category,
      includeSubSectionsBool,
      limitNum,
      pageNum,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single expert assessment by ID' })
  @ApiResponse({ status: 200, description: 'Expert assessment details', type: ExpertAssessment })
  @ApiResponse({ status: 404, description: 'Expert assessment not found' })
  async findOne(@Param('id') id: string): Promise<ExpertAssessment> {
    return this.expertAssessmentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expert assessment' })
  @ApiResponse({ status: 200, description: 'Expert assessment updated successfully', type: ExpertAssessment })
  @ApiResponse({ status: 404, description: 'Expert assessment not found' })
  @ApiResponse({ status: 409, description: 'Expert assessment with this name already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateExpertAssessmentDto: UpdateExpertAssessmentDto,
  ): Promise<ExpertAssessment> {
    return this.expertAssessmentService.update(id, updateExpertAssessmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expert assessment' })
  @ApiResponse({ status: 200, description: 'Expert assessment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Expert assessment not found' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.expertAssessmentService.remove(id);
    return { message: 'Expert assessment deleted successfully' };
  }
}
