import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AssessmentSubSectionRequestsService } from './assessment-sub-section-requests.service';
import { CreateAssessmentSubSectionRequestDto } from './dto/create-assessment-sub-section-request.dto';
import { ReviewAssessmentSubSectionRequestDto } from './dto/review-assessment-sub-section-request.dto';
import { AssessmentSubSectionRequestResponseDto } from './dto/assessment-sub-section-request-response.dto';
import { QueryAssessmentSubSectionRequestsDto } from './dto/query-assessment-sub-section-requests.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permissions } from '../../rbac/constants/permissions.constants';

@ApiTags('Assessment Sub-Section Requests')
@Controller('admin/assessment-sub-section/requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permissions.MANAGE_EXPERT_ASSESSMENT_REQUESTS)
@ApiBearerAuth('JWT-auth')
export class AssessmentSubSectionRequestsController {
  constructor(
    private readonly assessmentSubSectionRequestsService: AssessmentSubSectionRequestsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an assessment sub-section request for approval' })
  @ApiBody({ type: CreateAssessmentSubSectionRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Assessment sub-section request created successfully',
    type: AssessmentSubSectionRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Assessment sub-section or parent assessment not found' })
  async create(
    @Body() createDto: CreateAssessmentSubSectionRequestDto,
    @Request() req: any,
  ): Promise<AssessmentSubSectionRequestResponseDto> {
    const requestedBy = req.user?.id;
    return this.assessmentSubSectionRequestsService.create(createDto, requestedBy);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assessment sub-section requests with pagination and search' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of assessment sub-section requests',
  })
  async findAll(
    @Query() query: QueryAssessmentSubSectionRequestsDto,
  ): Promise<{
    data: AssessmentSubSectionRequestResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return this.assessmentSubSectionRequestsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an assessment sub-section request by ID' })
  @ApiParam({ name: 'id', description: 'Assessment Sub-Section Request ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Assessment sub-section request details',
    type: AssessmentSubSectionRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Assessment sub-section request not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AssessmentSubSectionRequestResponseDto> {
    return this.assessmentSubSectionRequestsService.findOne(id);
  }

  @Put(':id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review (approve/reject) an assessment sub-section request' })
  @ApiParam({ name: 'id', description: 'Assessment Sub-Section Request ID (UUID)' })
  @ApiBody({ type: ReviewAssessmentSubSectionRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Assessment sub-section request reviewed successfully',
    type: AssessmentSubSectionRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Assessment sub-section request not found' })
  @ApiResponse({ status: 400, description: 'Request already reviewed' })
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reviewDto: ReviewAssessmentSubSectionRequestDto,
    @Request() req: any,
  ): Promise<AssessmentSubSectionRequestResponseDto> {
    const reviewedBy = req.user?.id;
    return this.assessmentSubSectionRequestsService.review(id, reviewDto, reviewedBy);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an assessment sub-section request' })
  @ApiParam({ name: 'id', description: 'Assessment Sub-Section Request ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Assessment sub-section request deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Assessment sub-section request not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.assessmentSubSectionRequestsService.remove(id);
  }
}
