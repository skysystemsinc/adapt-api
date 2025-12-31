import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { InspectionReportsService } from './inspection-reports.service';
import { CreateInspectionReportDto } from './dto/create-inspection-report.dto';
import { UpdateInspectionReportDto } from './dto/update-inspection-report.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { validate } from 'class-validator';
import { AssessmentCategory } from '../expert-assessment/entities/expert-assessment.entity';
import { ApproveOrRejectInspectionReportDto } from './dto/approve-reject-inspection';
import { Permissions } from '../rbac/constants/permissions.constants';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import type { Response as ExpressResponse } from 'express';

@ApiTags('Inspection Reports')
@Controller('inspection-reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class InspectionReportsController {
  constructor(private readonly inspectionReportsService: InspectionReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new inspection report with all assessments and documents' })
  @ApiBody({ type: CreateInspectionReportDto, description: 'Inspection report data with base64-encoded files' })
  @ApiResponse({ status: 201, description: 'Inspection report created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createInspectionReportDto: CreateInspectionReportDto,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;

    // Transform and validate the DTO
    const errors = await validate(createInspectionReportDto);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      ).flat();
      throw new BadRequestException(errorMessages);
    }

    return this.inspectionReportsService.create(createInspectionReportDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inspection reports' })
  @ApiResponse({ status: 200, description: 'List of inspection reports' })
  findAll() {
    return this.inspectionReportsService.findAll();
  }

  //Get inspection report by assessment type
  @Get('assessment-type/:assessmentType')
  @ApiOperation({ summary: 'Get an inspection report by assessment type' })
  @ApiResponse({ status: 200, description: 'Inspection report found' })
  @ApiResponse({ status: 404, description: 'Inspection report not found' })
  findByAssessmentType(@Param('assessmentType') assessmentType: AssessmentCategory) {
    return this.inspectionReportsService.findByAssessmentType(assessmentType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an inspection report by ID' })
  @ApiResponse({ status: 200, description: 'Inspection report found' })
  @ApiResponse({ status: 404, description: 'Inspection report not found' })
  findOne(@Param('id') id: string) {
    return this.inspectionReportsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an inspection report' })
  @ApiResponse({ status: 200, description: 'Inspection report updated successfully' })
  @ApiResponse({ status: 404, description: 'Inspection report not found' })
  update(
    @Param('id') id: string,
    @Body() updateInspectionReportDto: UpdateInspectionReportDto,
  ) {
    return this.inspectionReportsService.update(id, updateInspectionReportDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an inspection report' })
  @ApiResponse({ status: 200, description: 'Inspection report deleted successfully' })
  @ApiResponse({ status: 404, description: 'Inspection report not found' })
  remove(@Param('id') id: string) {
    return this.inspectionReportsService.remove(id);
  }

  @Get('/application/:applicationId')
  @ApiOperation({ summary: 'Get an inspection report by application ID' })
  @ApiResponse({ status: 200, description: 'Inspection report found' })
  @ApiResponse({ status: 404, description: 'Inspection report not found' })
  findByApplicationId(@Param('applicationId') applicationId: string) {
    return this.inspectionReportsService.findByApplicationId(applicationId);
  }

  @Get('/application/:applicationId/assessment')
  @ApiOperation({ summary: 'Get an inspection report by application ID and user ID' })
  @ApiResponse({ status: 200, description: 'Inspection report found' })
  @ApiResponse({ status: 404, description: 'Inspection report not found' })
  findByApplicationIdAssessment(@Param('applicationId') applicationId: string,
    @Request() req: any,
    @Query('type') type?: string,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.inspectionReportsService.findByApplicationIdAssessment(applicationId, userId, type);
  }

  @Get('/application/:applicationId/type')
  @ApiOperation({ summary: 'Get application type (operator or location) by application ID' })
  @ApiResponse({ status: 200, description: 'Application type found' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  getApplicationType(@Param('applicationId') applicationId: string) {
    return this.inspectionReportsService.getApplicationType(applicationId);
  }

  @Patch(':id/approve-reject')
  @ApiOperation({ summary: 'Approve or reject an inspection report' })
  @ApiResponse({ status: 200, description: 'Inspection report approved or rejected successfully' })
  @ApiResponse({ status: 404, description: 'Inspection report not found' })
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permissions.IS_HOD)
  approveOrRejectInspectionReport(
    @Param('id') id: string,
    @Body() approveOrRejectInspectionReportDto: ApproveOrRejectInspectionReportDto,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.inspectionReportsService.approveOrReject(id, approveOrRejectInspectionReportDto, userId);
  }

  @Get('/documents/:id/download')
  @ApiOperation({ summary: 'Download assessment document' })
  @ApiResponse({ status: 200, description: 'Document downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async downloadDocument(
    @Param('id') id: string,
    @Res() res: ExpressResponse,
  ) {
    const { buffer, mimeType, filename } = await this.inspectionReportsService.downloadDocument(id);

    // Ensure filename is properly encoded for Content-Disposition header
    const encodedFilename = encodeURIComponent(filename);
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Frame-Options', 'DENY');

    res.send(buffer);
  }
}