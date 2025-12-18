import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Request,
  UseGuards,
  Query,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { InspectionReportRequestsService } from '../services/inspection-report-requests.service';
import { CreateInspectionReportRequestDto } from '../dto/create-inspection-report-request.dto';
import { ReviewInspectionReportRequestDto } from '../dto/review-inspection-report-request.dto';
import { InspectionReportRequestResponseDto } from '../dto/inspection-report-request-response.dto';
import { QueryInspectionReportRequestsDto } from '../dto/query-inspection-report-requests.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permissions } from '../../rbac/constants/permissions.constants';
import { validate } from 'class-validator';
import type { Response } from 'express';

@ApiTags('Inspection Report Requests')
@Controller('admin/inspection-reports/requests')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InspectionReportRequestsController {
  constructor(
    private readonly inspectionReportRequestsService: InspectionReportRequestsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an inspection report request for approval' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateInspectionReportRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Inspection report request created successfully',
    type: InspectionReportRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request (validation errors, file issues, etc.)' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'files', maxCount: 100 },
        { name: 'globalDocument', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB per file
        },
      },
    ),
  )
  async create(
    @Body() body: any,
    @UploadedFiles() files: { files?: any[]; globalDocument?: any[] },
    @Request() req: any,
  ): Promise<InspectionReportRequestResponseDto> {
    const userId = req.user?.sub || req.user?.id;

    // Parse FormData
    const parsedData: any = {
      assessmentType: body.assessmentType,
      maximumScore: body.maximumScore,
      obtainedScore: body.obtainedScore,
      percentage: body.percentage,
      grade: body.grade,
      selectedGrade: body.selectedGrade,
      assessmentGradingRemarks: body.assessmentGradingRemarks,
      overallComments: body.overallComments,
      warehouseOperatorApplicationId: body.warehouseOperatorApplicationId,
      warehouseLocationId: body.warehouseLocationId,
      inspectionReportId: body.inspectionReportId,
    };

    if (body.assessments) {
      try {
        parsedData.assessments =
          typeof body.assessments === 'string'
            ? JSON.parse(body.assessments)
            : body.assessments;

        // Transform score in each assessment from string to number
        if (Array.isArray(parsedData.assessments)) {
          parsedData.assessments = parsedData.assessments.map((assessment: any) => ({
            ...assessment,
            score:
              typeof assessment.score === 'string'
                ? parseFloat(assessment.score)
                : assessment.score,
          }));
        }
      } catch (error) {
        throw new BadRequestException('Invalid assessments JSON format');
      }
    }

    // Transform and validate the DTO
    const createDto = plainToInstance(CreateInspectionReportRequestDto, parsedData);
    const errors = await validate(createDto);

    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .flat();
      throw new BadRequestException(errorMessages.join(', '));
    }

    const assessmentFiles = files?.files || [];
    const globalDocumentFile = files?.globalDocument?.[0];

    if (!globalDocumentFile) {
      throw new BadRequestException('Global document is required');
    }

    return this.inspectionReportRequestsService.create(
      createDto,
      assessmentFiles,
      globalDocumentFile,
      userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all inspection report requests' })
  @ApiResponse({
    status: 200,
    description: 'List of all inspection report requests',
    type: [InspectionReportRequestResponseDto],
  })
  async findAll(
    @Query() query: QueryInspectionReportRequestsDto,
  ): Promise<{
    data: InspectionReportRequestResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return this.inspectionReportRequestsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an inspection report request by ID' })
  @ApiParam({ name: 'id', description: 'Inspection Report Request ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Inspection report request details',
    type: InspectionReportRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Inspection report request not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InspectionReportRequestResponseDto> {
    return this.inspectionReportRequestsService.findOne(id);
  }

  @Put(':id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review (approve/reject) an inspection report request' })
  @ApiParam({ name: 'id', description: 'Inspection Report Request ID (UUID)' })
  @ApiBody({ type: ReviewInspectionReportRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Inspection report request reviewed successfully',
    type: InspectionReportRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Inspection report request not found' })
  @ApiResponse({ status: 400, description: 'Request already reviewed' })
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reviewDto: ReviewInspectionReportRequestDto,
    @Request() req: any,
  ): Promise<InspectionReportRequestResponseDto> {
    const reviewedBy = req.user?.sub || req.user?.id;
    return this.inspectionReportRequestsService.review(id, reviewDto, reviewedBy);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an inspection report request' })
  @ApiParam({ name: 'id', description: 'Inspection Report Request ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Inspection report request deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Inspection report request not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete non-pending request' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.inspectionReportRequestsService.remove(id);
  }

  @Post(':id/documents/:type/download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Download a document from an inspection report request' })
  @ApiParam({ name: 'id', description: 'Inspection Report Request ID (UUID)' })
  @ApiParam({ name: 'type', description: 'Document type: "global" or "assessment"' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'File path (required for assessment documents)' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Document downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async downloadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('type') type: 'global' | 'assessment',
    @Body() body: { filePath?: string },
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.inspectionReportRequestsService.downloadDocument(
      id,
      type,
      body.filePath,
    );

    // Set headers for file download
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(result.filename)}"`,
    );
    res.send(result.buffer);
  }
}

