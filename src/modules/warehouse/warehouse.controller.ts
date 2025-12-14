import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException, UploadedFiles, Query } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateBankDetailsDto, CreateCompanyInformationRequestDto, CreateWarehouseOperatorApplicationRequestDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags, ApiConsumes, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/entities/user.entity';
import { FileInterceptor, FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UpdateBankDetailsDto } from './dto/create-bank-details.dto';
import { UpsertHrInformationDto, HrPersonalDetailsDto, HrDeclarationDto, HrAcademicQualificationDto, HrProfessionalQualificationDto, HrTrainingDto, HrExperienceDto } from './dto/create-hr-information.dto';
import { CreateFinancialInformationDto, OthersDto } from './dto/create-financial-information.dto';
import { CreateApplicantChecklistDto } from './dto/create-applicant-checklist.dto';
import {
  ApplicantChecklistApiBodySchema,
  ApplicantChecklistApiParam,
  ApplicantChecklistApiResponseSchema,
  ApplicantChecklistApiResponse400,
  ApplicantChecklistApiResponse401,
  ApplicantChecklistApiResponse404,
} from './swagger/applicant-checklist.swagger';
import {
  AuthorizedSignatoryApiBodySchema,
  AuthorizedSignatoryApiParam,
  AuthorizedSignatoryApiResponseSchema,
  AuthorizedSignatoryApiResponse400,
  AuthorizedSignatoryApiResponse401,
  AuthorizedSignatoryApiResponse404,
} from './swagger/authorized-signatory.swagger';
import { ListWarehouseOperatorApplicationDto } from './dto/list-warehouse.dto';
import { CreateAuthorizedSignatoryDto } from './dto/create-authorized-signatory.dto';
import { ResubmitOperatorApplicationDto } from './dto/resubmit-warehouse.dto';


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

  @ApiOperation({ summary: 'Resubmit a warehouse operator application' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: ResubmitOperatorApplicationDto })
  @Patch('/operator/application/resubmit')
  resubmitOperatorApplication(
    @Body() resubmitOperatorApplicationDto: ResubmitOperatorApplicationDto,
    @Request() request: any
  ) {
    const user = request.user as User;
    return this.warehouseService.resubmitOperatorApplication(resubmitOperatorApplicationDto, user.id);
  }

  @ApiOperation({ summary: 'Get application entity data by type and id' })
  @ApiBearerAuth('JWT-auth')
  @Get('/operator/application/entity/:entityType/:entityId')
  async getApplicationEntityById(
    @Param('entityType') entityType: 'authorized_signatories' | 'company_information' | 'bank_details' | 'hrs' | 'financial_information' | 'applicant_checklist',
    @Param('entityId') entityId: string,
  ) {
    return this.warehouseService.getApplicationEntityById(entityType, entityId);
  }

  @ApiOperation({ summary: 'Create a new authorized signatory for a warehouse operator application' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody(AuthorizedSignatoryApiBodySchema)
  @ApiParam(AuthorizedSignatoryApiParam)
  @ApiResponse(AuthorizedSignatoryApiResponseSchema)
  @ApiResponse(AuthorizedSignatoryApiResponse400)
  @ApiResponse(AuthorizedSignatoryApiResponse401)
  @ApiResponse(AuthorizedSignatoryApiResponse404)
  @Post('/operator/application/:id/authorized-signatory')
  createAuthorizedSignatory(
    @Param('id') id: string,
    @Body() createAuthorizedSignatoryDto: CreateAuthorizedSignatoryDto,
    @Request() request: any
  ) {
    const user = request.user as User;
    return this.warehouseService.createAuthorizedSignatory(id, createAuthorizedSignatoryDto, user.id);
  }

  @ApiOperation({ summary: 'Update authorized signatory' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody(AuthorizedSignatoryApiBodySchema)
  @ApiParam({
    name: 'authorizedSignatoryId',
    type: String,
    description: 'The ID of the authorized signatory to update',
  })
  @ApiResponse(AuthorizedSignatoryApiResponseSchema)
  @ApiResponse(AuthorizedSignatoryApiResponse400)
  @ApiResponse(AuthorizedSignatoryApiResponse401)
  @ApiResponse(AuthorizedSignatoryApiResponse404)
  @Patch('/operator/application/authorized-signatory/:authorizedSignatoryId')
  updateAuthorizedSignatory(
    @Param('authorizedSignatoryId') authorizedSignatoryId: string,
    @Body() createAuthorizedSignatoryDto: CreateAuthorizedSignatoryDto,
    @Request() request: any
  ) {
    const user = request.user as User;
    return this.warehouseService.updateAuthorizedSignatory(authorizedSignatoryId, createAuthorizedSignatoryDto, user.id);
  }

  @ApiOperation({ summary: 'Delete authorized signatory' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'authorizedSignatoryId',
    type: String,
    description: 'The ID of the authorized signatory to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Authorized signatory deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Authorized signatory deleted successfully',
        },
      },
    },
  })
  @ApiResponse(AuthorizedSignatoryApiResponse401)
  @ApiResponse(AuthorizedSignatoryApiResponse404)
  @Delete('/operator/application/authorized-signatory/:authorizedSignatoryId')
  deleteAuthorizedSignatory(
    @Param('authorizedSignatoryId') authorizedSignatoryId: string,
    @Request() request: any
  ) {
    const user = request.user as User;
    return this.warehouseService.deleteAuthorizedSignatory(authorizedSignatoryId, user.id);
  }

  @ApiOperation({ summary: 'Create company information' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateCompanyInformationRequestDto,
    description: 'Company information data with optional NTN certificate file'
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

  @ApiOperation({ summary: 'Update company information for a warehouse operator application' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('ntcCertificate', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  @Patch('/operator/application/:applicationId/company-information/:companyInformationId')
  updateCompanyInformation(
    @Body() createCompanyInformationDto: CreateCompanyInformationRequestDto,
    @UploadedFile() ntcCertificateFile: any,
    @Request() request: any,
    @Param('applicationId') applicationId: string,
    @Param('companyInformationId') companyInformationId: string
  ) {
    const user = request.user as User;
    return this.warehouseService.updateCompanyInformation(
      createCompanyInformationDto,
      user.id,
      applicationId,
      companyInformationId,
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

  @ApiOperation({ summary: 'Get HR information for an application' })
  @ApiBearerAuth('JWT-auth')
  @Get('/operator/application/:applicationId/hr-information')
  getHrInformation(
    @Param('applicationId') applicationId: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.getHrInformation(applicationId, user.id);
  }

  @ApiOperation({ summary: 'Delete HR information' })
  @ApiBearerAuth('JWT-auth')
  @Delete('/operator/application/:applicationId/hr-information/:hrInformationId')
  deleteHrInformation(
    @Param('applicationId') applicationId: string,
    @Param('hrInformationId') hrInformationId: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.deleteHrInformation(applicationId, hrInformationId, user.id);
  }

  @ApiOperation({ summary: 'Get first authorized signatory name and applicant legal status from warehouse operator application' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'First authorized signatory name and applicant legal status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            authorizedSignatoryName: { type: 'string', nullable: true },
            applicantLegalStatus: { type: 'string', nullable: true },
          },
        },
      },
    },
  })
  @Get('/operator/application/first-authorized-signatory')
  getFirstAuthorizedSignatoryName(@Request() request: any) {
    const user = request.user as User;
    return this.warehouseService.getFirstAuthorizedSignatoryName(user.id);
  }

  @ApiOperation({ summary: 'Get warehouse application with authorized signatories' })
  @ApiBearerAuth('JWT-auth')
  @Get('/operator/application/:applicationId/warehouse-application')
  getWarehouseApplication(
    @Param('applicationId') applicationId: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.getWarehouseApplication(applicationId, user.id);
  }

  @ApiOperation({ summary: 'Get company information for an application' })
  @ApiBearerAuth('JWT-auth')
  @Get('/operator/application/:applicationId/company-information')
  getCompanyInformation(
    @Param('applicationId') applicationId: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.getCompanyInformation(applicationId, user.id);
  }

  @ApiOperation({ summary: 'Get company information by id for an application' })
  @ApiBearerAuth('JWT-auth')
  @Get('/operator/application/company-information/:companyInformationId')
  getCompanyInformationById(
    @Param('companyInformationId') companyInformationId: string,
    @Request() request: any,
  ) {
    return this.warehouseService.getCompanyInformationById(companyInformationId);
  }


  @ApiOperation({ summary: 'Get bank details for an application' })
  @ApiBearerAuth('JWT-auth')
  @Get('/operator/application/:applicationId/bank-details')
  getBankDetails(
    @Param('applicationId') applicationId: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.getBankDetails(applicationId, user.id);
  }

  @ApiOperation({ summary: 'Get financial information for an application' })
  @ApiBearerAuth('JWT-auth')
  @Get('/operator/application/:applicationId/financial-information')
  getFinancialInformation(
    @Param('applicationId') applicationId: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.getFinancialInformation(applicationId, user.id);
  }

  @ApiOperation({ summary: 'Get applicant checklist for an application' })
  @ApiBearerAuth('JWT-auth')
  @Get('/operator/application/:applicationId/applicant-checklist')
  getApplicantChecklist(
    @Param('applicationId') applicationId: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.getApplicantChecklist(applicationId, user.id);
  }

  @ApiOperation({ summary: 'Create HR context for an application' })
  @ApiBearerAuth('JWT-auth')
  @Post('/operator/application/:applicationId/hr/context')
  createHrContext(
    @Param('applicationId') applicationId: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.createHrContext(applicationId, user.id);
  }

  @ApiOperation({ summary: 'Save or update personal details' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photograph', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  }))
  @Post('/operator/application/:applicationId/hr/personal-details')
  savePersonalDetails(
    @Param('applicationId') applicationId: string,
    @Body('data') dataString: string,
    @UploadedFile() photograph: any,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: HrPersonalDetailsDto;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;
    return this.warehouseService.savePersonalDetails(
      applicationId,
      payload,
      user.id,
      hrInformationId,
      photograph,
    );
  }

  @ApiOperation({ summary: 'Save or update declaration' })
  @ApiBearerAuth('JWT-auth')
  @Post('/operator/application/:applicationId/hr/declaration')
  saveDeclaration(
    @Param('applicationId') applicationId: string,
    @Body() dto: HrDeclarationDto,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    const user = request.user as User;
    return this.warehouseService.saveDeclaration(
      applicationId,
      dto,
      user.id,
      hrInformationId,
    );
  }

  @ApiOperation({ summary: 'Save a single academic qualification' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('academicCertificate', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  }))
  @Post('/operator/application/:applicationId/hr/academic-qualifications')
  createAcademicQualification(
    @Param('applicationId') applicationId: string,
    @Body('data') dataString: string,
    @UploadedFile() academicCertificate: any,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: HrAcademicQualificationDto;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;
    return this.warehouseService.saveAcademicQualification(
      applicationId,
      payload,
      user.id,
      undefined,
      academicCertificate,
      hrInformationId,
    );
  }

  @ApiOperation({ summary: 'Update a single academic qualification' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('academicCertificate', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  }))
  @Post('/operator/application/:applicationId/hr/academic-qualifications/:id')
  updateAcademicQualification(
    @Param('applicationId') applicationId: string,
    @Param('id') id: string,
    @Body('data') dataString: string,
    @UploadedFile() academicCertificate: any,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: HrAcademicQualificationDto;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;
    return this.warehouseService.saveAcademicQualification(
      applicationId,
      payload,
      user.id,
      id,
      academicCertificate,
      hrInformationId,
    );
  }

  @ApiOperation({ summary: 'Delete an academic qualification' })
  @ApiBearerAuth('JWT-auth')
  @Delete('/operator/application/hr/academic-qualifications/:id')
  deleteAcademicQualification(
    @Param('id') id: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.deleteAcademicQualification(id, user.id);
  }

  @ApiOperation({ summary: 'Save a single professional qualification' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('professionalCertificate', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  }))
  @Post('/operator/application/:applicationId/hr/professional-qualifications')
  createProfessionalQualification(
    @Param('applicationId') applicationId: string,
    @Body('data') dataString: string,
    @UploadedFile() professionalCertificate: any,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: HrProfessionalQualificationDto;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;
    return this.warehouseService.saveProfessionalQualification(
      applicationId,
      payload,
      user.id,
      undefined,
      professionalCertificate,
      hrInformationId,
    );
  }

  @ApiOperation({ summary: 'Update a single professional qualification' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('professionalCertificate', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  }))
  @Post('/operator/application/:applicationId/hr/professional-qualifications/:id')
  updateProfessionalQualification(
    @Param('applicationId') applicationId: string,
    @Param('id') id: string,
    @Body('data') dataString: string,
    @UploadedFile() professionalCertificate: any,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: HrProfessionalQualificationDto;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;
    return this.warehouseService.saveProfessionalQualification(
      applicationId,
      payload,
      user.id,
      id,
      professionalCertificate,
      hrInformationId,
    );
  }

  @ApiOperation({ summary: 'Delete a professional qualification' })
  @ApiBearerAuth('JWT-auth')
  @Delete('/operator/application/hr/professional-qualifications/:id')
  deleteProfessionalQualification(
    @Param('id') id: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.deleteProfessionalQualification(id, user.id);
  }

  @ApiOperation({ summary: 'Save a single training' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('trainingCertificate', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  }))
  @Post('/operator/application/:applicationId/hr/trainings')
  createTraining(
    @Param('applicationId') applicationId: string,
    @Body('data') dataString: string,
    @UploadedFile() trainingCertificate: any,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: HrTrainingDto;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;
    return this.warehouseService.saveTraining(
      applicationId,
      payload,
      user.id,
      undefined,
      trainingCertificate,
      hrInformationId,
    );
  }

  @ApiOperation({ summary: 'Update a single training' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('trainingCertificate', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  }))
  @Post('/operator/application/:applicationId/hr/trainings/:id')
  updateTraining(
    @Param('applicationId') applicationId: string,
    @Param('id') id: string,
    @Body('data') dataString: string,
    @UploadedFile() trainingCertificate: any,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: HrTrainingDto;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;
    return this.warehouseService.saveTraining(
      applicationId,
      payload,
      user.id,
      id,
      trainingCertificate,
      hrInformationId,
    );
  }

  @ApiOperation({ summary: 'Delete a training' })
  @ApiBearerAuth('JWT-auth')
  @Delete('/operator/application/hr/trainings/:id')
  deleteTraining(
    @Param('id') id: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.deleteTraining(id, user.id);
  }

  @ApiOperation({ summary: 'Save a single experience' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('experienceLetter', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  }))
  @Post('/operator/application/:applicationId/hr/experience')
  createExperience(
    @Param('applicationId') applicationId: string,
    @Body('data') dataString: string,
    @UploadedFile() experienceLetter: any,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: HrExperienceDto;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;
    return this.warehouseService.saveExperience(
      applicationId,
      payload,
      user.id,
      undefined,
      experienceLetter,
      hrInformationId,
    );
  }

  @ApiOperation({ summary: 'Update a single experience' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('experienceLetter', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  }))
  @Post('/operator/application/:applicationId/hr/experience/:id')
  updateExperience(
    @Param('applicationId') applicationId: string,
    @Param('id') id: string,
    @Body('data') dataString: string,
    @UploadedFile() experienceLetter: any,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: HrExperienceDto;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;
    return this.warehouseService.saveExperience(
      applicationId,
      payload,
      user.id,
      id,
      experienceLetter,
      hrInformationId,
    );
  }

  @ApiOperation({ summary: 'Delete an experience' })
  @ApiBearerAuth('JWT-auth')
  @Delete('/operator/application/hr/experience/:id')
  deleteExperience(
    @Param('id') id: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.deleteExperience(id, user.id);
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

  @ApiOperation({ summary: 'Save a new other document' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('document', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  @Post('/operator/application/:applicationId/financial-information/others')
  saveOther(
    @Param('applicationId') applicationId: string,
    @Body('data') dataString: string,
    @UploadedFile() documentFile: any,
    @Request() request: any,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: OthersDto;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;
    return this.warehouseService.saveOther(applicationId, payload, user.id, undefined, documentFile);
  }

  @ApiOperation({ summary: 'Update an existing other document' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('document', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  @Post('/operator/application/:applicationId/financial-information/others/:id')
  updateOther(
    @Param('applicationId') applicationId: string,
    @Param('id') id: string,
    @Body('data') dataString: string,
    @UploadedFile() documentFile: any,
    @Request() request: any,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: OthersDto;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;
    return this.warehouseService.saveOther(applicationId, payload, user.id, id, documentFile);
  }

  @ApiOperation({ summary: 'Delete an other document' })
  @ApiBearerAuth('JWT-auth')
  @Delete('/operator/application/financial-information/others/:id')
  deleteOther(
    @Param('id') id: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.deleteOther(id, user.id);
  }

  @ApiOperation({ summary: 'Save a new financial subsection (unified endpoint)' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'sectionType', enum: ['audit-report', 'tax-return', 'bank-statement', 'other'] })
  @UseInterceptors(
    FilesInterceptor('documents', 10, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max per file
      },
    }),
  )
  @Post('/operator/application/:applicationId/financial-information/:sectionType')
  saveFinancialSubsection(
    @Param('applicationId') applicationId: string,
    @Param('sectionType') sectionType: 'audit-report' | 'tax-return' | 'bank-statement' | 'other',
    @Body('data') dataString: string,
    @UploadedFiles() documentFiles: any,
    @Request() request: any,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: any;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;

    // For tax-return and audit-report, use multiple files; for others, use first file (backward compatibility)
    let documentFile: any = undefined;
    if (sectionType === 'tax-return' || sectionType === 'audit-report') {
      // Multiple files for tax-return and audit-report
      documentFile = documentFiles && documentFiles.length > 0 ? documentFiles : undefined;
    } else {
      // Single file for other sections (backward compatibility)
      // Also check for 'document' field in case frontend sends single file
      documentFile = documentFiles && documentFiles.length > 0 ? documentFiles[0] : request.body?.document;
    }

    return this.warehouseService.saveFinancialSubsection(
      sectionType,
      applicationId,
      payload,
      user.id,
      undefined,
      documentFile,
    );
  }

  @ApiOperation({ summary: 'Update an existing financial subsection (unified endpoint)' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'sectionType', enum: ['audit-report', 'tax-return', 'bank-statement', 'other'] })
  @UseInterceptors(
    FilesInterceptor('documents', 10, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max per file
      },
    }),
  )
  @Post('/operator/application/:applicationId/financial-information/:sectionType/:id')
  updateFinancialSubsection(
    @Param('applicationId') applicationId: string,
    @Param('sectionType') sectionType: 'audit-report' | 'tax-return' | 'bank-statement' | 'other',
    @Param('id') id: string,
    @Body('data') dataString: string,
    @UploadedFiles() documentFiles: any,
    @Request() request: any,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: any;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON in data field');
    }

    const user = request.user as User;

    // For tax-return and audit-report, use multiple files; for others, use first file (backward compatibility)
    let documentFile: any = undefined;
    if (sectionType === 'tax-return' || sectionType === 'audit-report') {
      // Multiple files for tax-return and audit-report
      documentFile = documentFiles && documentFiles.length > 0 ? documentFiles : undefined;
    } else {
      // Single file for other sections (backward compatibility)
      documentFile = documentFiles && documentFiles.length > 0 ? documentFiles[0] : request.body?.document;
    }

    return this.warehouseService.saveFinancialSubsection(
      sectionType,
      applicationId,
      payload,
      user.id,
      id,
      documentFile,
    );
  }

  @ApiOperation({ summary: 'Delete a financial subsection (unified endpoint)' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'sectionType', enum: ['audit-report', 'tax-return', 'bank-statement', 'other'] })
  @Delete('/operator/application/:applicationId/financial-information/:sectionType/:id')
  deleteFinancialSubsection(
    @Param('applicationId') applicationId: string,
    @Param('sectionType') sectionType: 'audit-report' | 'tax-return' | 'bank-statement' | 'other',
    @Param('id') id: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.deleteFinancialSubsection(sectionType, id, user.id);
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
    @Query('submit') submitParam?: string,
    @UploadedFiles() files?: {
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
    @Request() request?: any,
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

    const user = request?.user as User;
    if (!user) {
      throw new BadRequestException('User not found in request');
    }
    const submit = submitParam === 'true' || submitParam === '1';
    return this.warehouseService.createApplicantChecklist(applicationId, payload, user.id, files, submit);
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

  // get warehouse application status by user id 
  @Get('/operator/application/status')
  getWarehouseApplicationStatus(@Request() request: any) {
    const user = request.user as User;
    return this.warehouseService.getWarehouseApplicationStatus(user.id);
  }

  @ApiOperation({ summary: 'Get resource status for a warehouse operator application' })
  @ApiParam({ name: 'applicationId', description: 'The ID of the warehouse operator application' })
  @ApiQuery({ name: 'resourceType', enum: ['hr', 'authorized-signatories'] })
  @ApiResponse({ status: 200, description: 'Resource status retrieved successfully', type: Object, example: { message: 'Resource status retrieved successfully', data: { unlockedSections: ['1. Authorized Signatories', '4. HR Information'] } } })
  @Get('/operator/application/:applicationId/resource/status')
  getResourceStatus(@Param('applicationId') applicationId: string, @Request() request: any,
    @Query('resourceType') resourceType: 'bank-statement' | 'company-information' | 'hr' | 'authorized-signatories' | 'financial-information' | 'applicant-checklist'
  ) {
    const user = request.user as User;
    return this.warehouseService.getResourceStatus(applicationId, user.id, resourceType);
  }

  @ApiOperation({ summary: 'Get resubmission progress for a rejected warehouse operator application' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'applicationId', description: 'The ID of the warehouse operator application' })
  @ApiResponse({ 
    status: 200, 
    description: 'Resubmission progress retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            totalRejected: { type: 'number', example: 7 },
            totalResubmitted: { type: 'number', example: 5 },
            remaining: { type: 'number', example: 2 },
            progressPercentage: { type: 'number', example: 71 },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sectionType: { type: 'string', example: '4-hr-information' },
                  sectionName: { type: 'string', example: 'HR Information' },
                  rejected: { type: 'number', example: 7 },
                  resubmitted: { type: 'number', example: 5 },
                  remaining: { type: 'number', example: 2 },
                  isComplete: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
      },
    },
  })
  @Get('/operator/application/:applicationId/resubmission-progress')
  getResubmissionProgress(@Param('applicationId') applicationId: string, @Request() request: any) {
    const user = request.user as User;
    return this.warehouseService.getResubmissionProgress(applicationId, user.id);
  }
}
