import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UploadedFiles, UseInterceptors, BadRequestException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { InspectionReportsService } from './inspection-reports.service';
import { CreateInspectionReportDto } from './dto/create-inspection-report.dto';
import { UpdateInspectionReportDto } from './dto/update-inspection-report.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AssessmentCategory } from '../expert-assessment/entities/expert-assessment.entity';
import { ApproveOrRejectInspectionReportDto } from './dto/approve-reject-inspection';
import { Permissions } from '../rbac/constants/permissions.constants';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';

@ApiTags('Inspection Reports')
@Controller('inspection-reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class InspectionReportsController {
  constructor(private readonly inspectionReportsService: InspectionReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new inspection report with all assessments and documents' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Inspection report created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'files', maxCount: 100 },
      { name: 'globalDocument', maxCount: 1 },
    ], {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
      },
    }),
  )
  async create(
    @Body() body: any,
    @UploadedFiles() files: { files?: any[]; globalDocument?: any[] },
    @Request() req: any,
  ) {
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
    };

    if (body.assessments) {
      try {
        parsedData.assessments = typeof body.assessments === 'string' 
          ? JSON.parse(body.assessments) 
          : body.assessments;
        
        // Transform score in each assessment from string to number
        if (Array.isArray(parsedData.assessments)) {
          parsedData.assessments = parsedData.assessments.map((assessment: any) => ({
            ...assessment,
            score: typeof assessment.score === 'string' 
              ? parseFloat(assessment.score) 
              : assessment.score,
          }));
        }
      } catch (error) {
        throw new BadRequestException('Invalid assessments JSON format');
      }
    }

    // Transform and validate the DTO
    const createInspectionReportDto = plainToInstance(CreateInspectionReportDto, parsedData);
    const errors = await validate(createInspectionReportDto);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      ).flat();
      throw new BadRequestException(errorMessages);
    }

    const assessmentFiles = files?.files || [];
    const globalDocumentFile = files?.globalDocument?.[0];
    
    if (!globalDocumentFile) {
      throw new BadRequestException('Global document is required');
    }

    return this.inspectionReportsService.create(createInspectionReportDto, assessmentFiles, globalDocumentFile, userId);
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
}