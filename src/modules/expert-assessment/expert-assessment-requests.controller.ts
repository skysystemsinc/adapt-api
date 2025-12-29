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
import { ExpertAssessmentRequestsService } from './expert-assessment-requests.service';
import { CreateExpertAssessmentRequestDto } from './dto/create-expert-assessment-request.dto';
import { ReviewExpertAssessmentRequestDto } from './dto/review-expert-assessment-request.dto';
import { ExpertAssessmentRequestResponseDto } from './dto/expert-assessment-request-response.dto';
import { QueryExpertAssessmentRequestsDto } from './dto/query-expert-assessment-requests.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permissions } from '../rbac/constants/permissions.constants';

@ApiTags('Expert Assessment Requests')
@Controller('admin/expert-assessment/requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permissions.MANAGE_EXPERT_ASSESSMENT_REQUESTS)
@ApiBearerAuth('JWT-auth')
export class ExpertAssessmentRequestsController {
  constructor(
    private readonly expertAssessmentRequestsService: ExpertAssessmentRequestsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an expert assessment request for approval' })
  @ApiBody({ type: CreateExpertAssessmentRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Expert assessment request created successfully',
    type: ExpertAssessmentRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Expert assessment not found' })
  async create(
    @Body() createDto: CreateExpertAssessmentRequestDto,
    @Request() req: any,
  ): Promise<ExpertAssessmentRequestResponseDto> {
    const requestedBy = req.user?.id;
    return this.expertAssessmentRequestsService.create(createDto, requestedBy);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expert assessment requests with pagination and search' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of expert assessment requests',
  })
  async findAll(
    @Query() query: QueryExpertAssessmentRequestsDto,
  ): Promise<{
    data: ExpertAssessmentRequestResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return this.expertAssessmentRequestsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an expert assessment request by ID' })
  @ApiParam({ name: 'id', description: 'Expert Assessment Request ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Expert assessment request details',
    type: ExpertAssessmentRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Expert assessment request not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExpertAssessmentRequestResponseDto> {
    return this.expertAssessmentRequestsService.findOne(id);
  }

  @Put(':id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review (approve/reject) an expert assessment request' })
  @ApiParam({ name: 'id', description: 'Expert Assessment Request ID (UUID)' })
  @ApiBody({ type: ReviewExpertAssessmentRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Expert assessment request reviewed successfully',
    type: ExpertAssessmentRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Expert assessment request not found' })
  @ApiResponse({ status: 400, description: 'Request already reviewed' })
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reviewDto: ReviewExpertAssessmentRequestDto,
    @Request() req: any,
  ): Promise<ExpertAssessmentRequestResponseDto> {
    const reviewedBy = req.user?.id;
    return this.expertAssessmentRequestsService.review(id, reviewDto, reviewedBy);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an expert assessment request' })
  @ApiParam({ name: 'id', description: 'Expert Assessment Request ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Expert assessment request deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Expert assessment request not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.expertAssessmentRequestsService.remove(id);
  }
}
