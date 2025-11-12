import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException, UploadedFiles, Query } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateBankDetailsDto, CreateCompanyInformationRequestDto, CreateWarehouseOperatorApplicationRequestDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags, ApiConsumes, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/entities/user.entity';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { UpdateBankDetailsDto } from './dto/create-bank-details.dto';
import { UpsertHrInformationDto } from './dto/create-hr-information.dto';
import { CreateFinancialInformationDto } from './dto/create-financial-information.dto';
import { CreateApplicantChecklistDto } from './dto/create-applicant-checklist.dto';
import {
  ApplicantChecklistApiBodySchema,
  ApplicantChecklistApiParam,
  ApplicantChecklistApiResponseSchema,
  ApplicantChecklistApiResponse400,
  ApplicantChecklistApiResponse401,
  ApplicantChecklistApiResponse404,
} from './swagger/applicant-checklist.swagger';
import { ListWarehouseOperatorApplicationDto } from './dto/list-warehouse.dto';

@ApiTags('Warehouse')
@ApiBearerAuth('JWT-auth')
@Controller('warehouse')
@UseGuards(JwtAuthGuard)
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly authService: AuthService
  ) { }

  @ApiOperation({ summary: 'List all warehouse operator applications' })
  @ApiBearerAuth('JWT-auth')
  @Get('/operator/applications')
  listWarehouseOperatorApplication(
    @Query() listWarehouseOperatorApplicationDto: ListWarehouseOperatorApplicationDto,
    @Request() request: any
  ) {
    const user = request.user as User;
    return this.warehouseService.listWarehouseOperatorApplication(user.id, listWarehouseOperatorApplicationDto);
  }
  
  @ApiOperation({ summary: 'Create a new warehouse operator application' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CreateWarehouseOperatorApplicationRequestDto })
  @Post('/operator/application')
  createOperatorApplication(
    @Body() createWarehouseDto: CreateWarehouseOperatorApplicationRequestDto,
    @Request() request: any
  ) {
    const user = request.user as User;
    return this.warehouseService.createOperatorApplication(createWarehouseDto, user.id);
  }

  @ApiOperation({ summary: 'Create company information' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateCompanyInformationRequestDto,
    description: 'Company information data with optional NTC certificate file'
  })
  @UseInterceptors(
    FileInterceptor('ntcCertificate', {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
      },
    }),
  )
  @Post('/operator/application/:id/company-information')
  createCompanyInformation(
    @Body() createCompanyInformationDto: CreateCompanyInformationRequestDto,
    @UploadedFile() ntcCertificateFile: any,
    @Request() request: any,
    @Param('id') id: string
  ) {
    const user = request.user as User;
    return this.warehouseService.createCompanyInformation(
      createCompanyInformationDto,
      user.id,
      id,
      ntcCertificateFile
    );
  }

  @ApiOperation({ summary: 'Upload warehouse document' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  @Post('/documents/upload')
  async uploadDocument(
    @UploadedFile() file: any,
    @Body('documentableType') documentableType: string,
    @Body('documentableId') documentableId: string,
    @Body('documentType') documentType: string,
    @Request() request: any
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!documentableType) {
      throw new BadRequestException('documentableType is required');
    }

    if (!documentableId) {
      throw new BadRequestException('documentableId is required');
    }

    if (!documentType) {
      throw new BadRequestException('documentType is required');
    }

    const user = request.user as User;
    return this.warehouseService.uploadWarehouseDocument(
      file,
      user.id,
      documentableType,
      documentableId,
      documentType
    );
  }

  @ApiOperation({ summary: 'Create a new bank details for a warehouse operator application' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CreateBankDetailsDto })
  @Post('/operator/application/:applicationId/bank-details')
  createBankDetails(
    @Param('applicationId') applicationId: string,
    @Body() createBankDetailsDto: CreateBankDetailsDto,
    @Request() request: any
  ) {
    const user = request.user as User;
    return this.warehouseService.createBankDetails(applicationId, createBankDetailsDto, user.id);
  }

  @ApiOperation({ summary: 'Create or update HR information profile' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpsertHrInformationDto,
    description: 'HR information data with files (photograph, certificates, etc.)'
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'photograph', maxCount: 1 },
      { name: 'academicCertificates', maxCount: 50 },
      { name: 'professionalCertificates', maxCount: 50 },
      { name: 'trainingCertificates', maxCount: 50 },
      { name: 'experienceLetters', maxCount: 50 },
    ], {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max per file
      },
    }),
  )
  @Post('/operator/application/:applicationId/hr-information')
  upsertHrInformation(
    @Param('applicationId') applicationId: string,
    @Body('data') dataString: string,
    @UploadedFiles() files: {
      photograph?: any[];
      academicCertificates?: any[];
      professionalCertificates?: any[];
      trainingCertificates?: any[];
      experienceLetters?: any[];
    },
    @Request() request: any,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: UpsertHrInformationDto;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;
    return this.warehouseService.upsertHrInformation(
      applicationId,
      payload,
      user.id,
      files
    );
  }

  @ApiOperation({ summary: 'Create or update financial information' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CreateFinancialInformationDto })
  @Post('/operator/application/:applicationId/financial-information')
  createFinancialInformation(
    @Param('applicationId') applicationId: string,
    @Body() payload: CreateFinancialInformationDto,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.createFinancialInformation(applicationId, payload, user.id);
  }

  @ApiOperation({ summary: 'Update a bank details for a warehouse operator application' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: UpdateBankDetailsDto })
  @Patch('/operator/application/:applicationId/bank-details/:bankDetailsId')
  updateBankDetails(
    @Param('applicationId') applicationId: string,
    @Param('bankDetailsId') bankDetailsId: string,
    @Body() updateBankDetailsDto: UpdateBankDetailsDto,
    @Request() request: any
  ) { 
    const user = request.user as User;
    return this.warehouseService.updateBankDetails(applicationId, bankDetailsId, updateBankDetailsDto, user.id);
  }

  @ApiOperation({ 
    summary: 'Create or update applicant checklist for a warehouse operator application',
    description: 'Submit applicant checklist with optional file uploads. Files are uploaded via multipart/form-data and linked to warehouse_documents table.'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiParam(ApplicantChecklistApiParam)
  @ApiBody(ApplicantChecklistApiBodySchema)
  @ApiResponse(ApplicantChecklistApiResponseSchema)
  @ApiResponse(ApplicantChecklistApiResponse400)
  @ApiResponse(ApplicantChecklistApiResponse401)
  @ApiResponse(ApplicantChecklistApiResponse404)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'qcPersonnelFile', maxCount: 1 },
      { name: 'warehouseSupervisorFile', maxCount: 1 },
      { name: 'dataEntryOperatorFile', maxCount: 1 },
      { name: 'auditedFinancialStatementsFile', maxCount: 1 },
      { name: 'positiveNetWorthFile', maxCount: 1 },
      { name: 'noLoanDefaultsFile', maxCount: 1 },
      { name: 'cleanCreditHistoryFile', maxCount: 1 },
      { name: 'adequateWorkingCapitalFile', maxCount: 1 },
      { name: 'validInsuranceCoverageFile', maxCount: 1 },
      { name: 'noFinancialFraudFile', maxCount: 1 },
      { name: 'bankPaymentSlip', maxCount: 1 },
    ], {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max per file
      },
    }),
  )
  @Post('/operator/application/:applicationId/applicant-checklist')
  createApplicantChecklist(
    @Param('applicationId') applicationId: string,
    @Body('data') dataString: string,
    @UploadedFiles() files: {
      qcPersonnelFile?: any[];
      warehouseSupervisorFile?: any[];
      dataEntryOperatorFile?: any[];
      auditedFinancialStatementsFile?: any[];
      positiveNetWorthFile?: any[];
      noLoanDefaultsFile?: any[];
      cleanCreditHistoryFile?: any[];
      adequateWorkingCapitalFile?: any[];
      validInsuranceCoverageFile?: any[];
      noFinancialFraudFile?: any[];
      bankPaymentSlip?: any[];
    },
    @Request() request: any,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: CreateApplicantChecklistDto;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;
    return this.warehouseService.createApplicantChecklist(applicationId, payload, user.id, files);
  }

  @Get()
  findAll() {
    return this.warehouseService.findAll();
  }

  @Get('/operator/:id')
  findOneWarehouseOperator(
    @Request() request: any,
    @Param('id') id: string
  ) {
    const user = request.user as User;
    return this.warehouseService.findOneWarehouseOperator(id, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.warehouseService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWarehouseDto: UpdateWarehouseDto) {
    return this.warehouseService.update(+id, updateWarehouseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.warehouseService.remove(+id);
  }
}
