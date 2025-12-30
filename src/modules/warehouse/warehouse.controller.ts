import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException, Query, Res } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateBankDetailsDto, CreateCompanyInformationRequestDto, CreateWarehouseOperatorApplicationRequestDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags, ApiConsumes, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/entities/user.entity';
import { createAndValidateFileFromBase64 } from 'src/common/utils/file-utils';
import { UpdateBankDetailsDto } from './dto/create-bank-details.dto';
import { UpsertHrInformationDto, HrPersonalDetailsDto, HrDeclarationDto, HrAcademicQualificationDto, HrProfessionalQualificationDto, HrTrainingDto, HrExperienceDto } from './dto/create-hr-information.dto';
import { CreateFinancialInformationDto, OthersDto, FinancialSubsectionDto } from './dto/create-financial-information.dto';
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
import { OperatorUnlockRequestDto } from './dto/operator-unlock-request.dto';


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
  @ApiConsumes('application/json')
  @ApiBody({
    type: CreateCompanyInformationRequestDto,
    description: 'Company information data with optional NTN certificate file (base64 encoded)'
  })
  @Post('/operator/application/:id/company-information')
  createCompanyInformation(
    @Body() createCompanyInformationDto: CreateCompanyInformationRequestDto,
    @Request() request: any,
    @Param('id') id: string
  ) {
    const user = request.user as User;
    
    // Convert base64 file to file-like object if provided
    let ntcCertificateFile: any = undefined;
    if (createCompanyInformationDto.ntcCertificate) {
      ntcCertificateFile = createAndValidateFileFromBase64(
        {
          file: createCompanyInformationDto.ntcCertificate.file,
          fileName: createCompanyInformationDto.ntcCertificate.fileName,
          fileSize: createCompanyInformationDto.ntcCertificate.fileSize,
          mimeType: createCompanyInformationDto.ntcCertificate.mimeType,
        },
        100 * 1024 * 1024, // 100MB max
      );
    }
    
    return this.warehouseService.createCompanyInformation(
      createCompanyInformationDto,
      user.id,
      id,
      ntcCertificateFile
    );
  }

  @ApiOperation({ summary: 'Update company information for a warehouse operator application' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('application/json')
  @ApiBody({
    type: CreateCompanyInformationRequestDto,
    description: 'Company information data with optional NTN certificate file (base64 encoded)'
  })
  @Patch('/operator/application/:applicationId/company-information/:companyInformationId')
  updateCompanyInformation(
    @Body() createCompanyInformationDto: CreateCompanyInformationRequestDto,
    @Request() request: any,
    @Param('applicationId') applicationId: string,
    @Param('companyInformationId') companyInformationId: string
  ) {
    const user = request.user as User;
    
    // Convert base64 file to file-like object if provided
    let ntcCertificateFile: any = undefined;
    if (createCompanyInformationDto.ntcCertificate) {
      ntcCertificateFile = createAndValidateFileFromBase64(
        {
          file: createCompanyInformationDto.ntcCertificate.file,
          fileName: createCompanyInformationDto.ntcCertificate.fileName,
          fileSize: createCompanyInformationDto.ntcCertificate.fileSize,
          mimeType: createCompanyInformationDto.ntcCertificate.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      );
    }
    
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
  @ApiConsumes('application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'object',
          properties: {
            file: { type: 'string', format: 'base64' },
            fileName: { type: 'string' },
            fileSize: { type: 'number' },
            mimeType: { type: 'string' },
          },
        },
        documentableType: { type: 'string' },
        documentableId: { type: 'string' },
        documentType: { type: 'string' },
      },
      required: ['file', 'documentableType', 'documentableId', 'documentType'],
    },
  })
  @Post('/documents/upload')
  async uploadDocument(
    @Body('file') fileDto: any,
    @Body('documentableType') documentableType: string,
    @Body('documentableId') documentableId: string,
    @Body('documentType') documentType: string,
    @Request() request: any
  ) {
    if (!fileDto) {
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

    // Convert base64 to file-like object
    const file = createAndValidateFileFromBase64(
      {
        file: fileDto.file,
        fileName: fileDto.fileName,
        fileSize: fileDto.fileSize,
        mimeType: fileDto.mimeType,
      },
      10 * 1024 * 1024, // 10MB max
    );

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
  @ApiConsumes('application/json')
  @ApiBody({
    type: UpsertHrInformationDto,
    description: 'HR information data with files (photograph, certificates, etc.) - base64 encoded'
  })
  @Post('/operator/application/:applicationId/hr-information')
  upsertHrInformation(
    @Param('applicationId') applicationId: string,
    @Body() payload: UpsertHrInformationDto,
    @Request() request: any,
  ) {
    const user = request.user as User;
    
    // Convert base64 files to file-like objects
    const files: {
      photograph?: any[];
      academicCertificates?: any[];
      professionalCertificates?: any[];
      trainingCertificates?: any[];
      experienceLetters?: any[];
    } = {};

    if (payload.photograph) {
      files.photograph = [createAndValidateFileFromBase64(
        {
          file: payload.photograph.file,
          fileName: payload.photograph.fileName,
          fileSize: payload.photograph.fileSize,
          mimeType: payload.photograph.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      )];
    }

    if (payload.academicCertificates && payload.academicCertificates.length > 0) {
      files.academicCertificates = payload.academicCertificates.map(cert => 
        createAndValidateFileFromBase64(
          {
            file: cert.file,
            fileName: cert.fileName,
            fileSize: cert.fileSize,
            mimeType: cert.mimeType,
          },
          10 * 1024 * 1024,
        )
      );
    }

    if (payload.professionalCertificates && payload.professionalCertificates.length > 0) {
      files.professionalCertificates = payload.professionalCertificates.map(cert => 
        createAndValidateFileFromBase64(
          {
            file: cert.file,
            fileName: cert.fileName,
            fileSize: cert.fileSize,
            mimeType: cert.mimeType,
          },
          10 * 1024 * 1024,
        )
      );
    }

    if (payload.trainingCertificates && payload.trainingCertificates.length > 0) {
      files.trainingCertificates = payload.trainingCertificates.map(cert => 
        createAndValidateFileFromBase64(
          {
            file: cert.file,
            fileName: cert.fileName,
            fileSize: cert.fileSize,
            mimeType: cert.mimeType,
          },
          10 * 1024 * 1024,
        )
      );
    }

    if (payload.experienceLetters && payload.experienceLetters.length > 0) {
      files.experienceLetters = payload.experienceLetters.map(letter => 
        createAndValidateFileFromBase64(
          {
            file: letter.file,
            fileName: letter.fileName,
            fileSize: letter.fileSize,
            mimeType: letter.mimeType,
          },
          10 * 1024 * 1024,
        )
      );
    }

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
  @ApiConsumes('application/json')
  @Post('/operator/application/:applicationId/hr/personal-details')
  savePersonalDetails(
    @Param('applicationId') applicationId: string,
    @Body() payload: HrPersonalDetailsDto,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    const user = request.user as User;
    
    // Extract and convert base64 photograph to file-like object if provided
    // Remove it from payload since service expects string (UUID) or undefined
    let photograph: any = undefined;
    if (payload.photograph && typeof payload.photograph === 'object' && 'file' in payload.photograph) {
      photograph = createAndValidateFileFromBase64(
        {
          file: payload.photograph.file,
          fileName: payload.photograph.fileName,
          fileSize: payload.photograph.fileSize,
          mimeType: payload.photograph.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      );
      // Remove from payload - service expects string (UUID) or undefined
      (payload as any).photograph = undefined;
    }
    
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
  @ApiConsumes('application/json')
  @Post('/operator/application/:applicationId/hr/academic-qualifications')
  createAcademicQualification(
    @Param('applicationId') applicationId: string,
    @Body() payload: HrAcademicQualificationDto,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    const user = request.user as User;
    
    // Extract and convert base64 certificate to file-like object if provided
    let academicCertificate: any = undefined;
    if (payload.academicCertificate && typeof payload.academicCertificate === 'object' && 'file' in payload.academicCertificate) {
      academicCertificate = createAndValidateFileFromBase64(
        {
          file: payload.academicCertificate.file,
          fileName: payload.academicCertificate.fileName,
          fileSize: payload.academicCertificate.fileSize,
          mimeType: payload.academicCertificate.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      );
      // Remove from payload - service expects string (UUID) or undefined
      (payload as any).academicCertificate = undefined;
    }
    
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
  @ApiConsumes('application/json')
  @Post('/operator/application/:applicationId/hr/academic-qualifications/:id')
  updateAcademicQualification(
    @Param('applicationId') applicationId: string,
    @Param('id') id: string,
    @Body() payload: HrAcademicQualificationDto,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    const user = request.user as User;
    
    // Extract and convert base64 certificate to file-like object if provided
    let academicCertificate: any = undefined;
    if (payload.academicCertificate && typeof payload.academicCertificate === 'object' && 'file' in payload.academicCertificate) {
      academicCertificate = createAndValidateFileFromBase64(
        {
          file: payload.academicCertificate.file,
          fileName: payload.academicCertificate.fileName,
          fileSize: payload.academicCertificate.fileSize,
          mimeType: payload.academicCertificate.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      );
      // Remove from payload - service expects string (UUID) or undefined
      (payload as any).academicCertificate = undefined;
    }
    
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
  @ApiConsumes('application/json')
  @Post('/operator/application/:applicationId/hr/professional-qualifications')
  createProfessionalQualification(
    @Param('applicationId') applicationId: string,
    @Body() payload: HrProfessionalQualificationDto,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    const user = request.user as User;
    
    // Extract and convert base64 certificate to file-like object if provided
    let professionalCertificate: any = undefined;
    if (payload.professionalCertificate && typeof payload.professionalCertificate === 'object' && 'file' in payload.professionalCertificate) {
      professionalCertificate = createAndValidateFileFromBase64(
        {
          file: payload.professionalCertificate.file,
          fileName: payload.professionalCertificate.fileName,
          fileSize: payload.professionalCertificate.fileSize,
          mimeType: payload.professionalCertificate.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      );
      // Remove from payload - service expects string (UUID) or undefined
      (payload as any).professionalCertificate = undefined;
    }
    
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
  @ApiConsumes('application/json')
  @Post('/operator/application/:applicationId/hr/professional-qualifications/:id')
  updateProfessionalQualification(
    @Param('applicationId') applicationId: string,
    @Param('id') id: string,
    @Body() payload: HrProfessionalQualificationDto,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    const user = request.user as User;
    
    // Extract and convert base64 certificate to file-like object if provided
    let professionalCertificate: any = undefined;
    if (payload.professionalCertificate && typeof payload.professionalCertificate === 'object' && 'file' in payload.professionalCertificate) {
      professionalCertificate = createAndValidateFileFromBase64(
        {
          file: payload.professionalCertificate.file,
          fileName: payload.professionalCertificate.fileName,
          fileSize: payload.professionalCertificate.fileSize,
          mimeType: payload.professionalCertificate.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      );
      // Remove from payload - service expects string (UUID) or undefined
      (payload as any).professionalCertificate = undefined;
    }
    
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
  @ApiConsumes('application/json')
  @Post('/operator/application/:applicationId/hr/trainings')
  createTraining(
    @Param('applicationId') applicationId: string,
    @Body() payload: HrTrainingDto,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    const user = request.user as User;
    
    // Extract and convert base64 certificate to file-like object if provided
    let trainingCertificate: any = undefined;
    if (payload.trainingCertificate && typeof payload.trainingCertificate === 'object' && 'file' in payload.trainingCertificate) {
      trainingCertificate = createAndValidateFileFromBase64(
        {
          file: payload.trainingCertificate.file,
          fileName: payload.trainingCertificate.fileName,
          fileSize: payload.trainingCertificate.fileSize,
          mimeType: payload.trainingCertificate.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      );
      // Remove from payload - service expects string (UUID) or undefined
      (payload as any).trainingCertificate = undefined;
    }
    
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
  @ApiConsumes('application/json')
  @Post('/operator/application/:applicationId/hr/trainings/:id')
  updateTraining(
    @Param('applicationId') applicationId: string,
    @Param('id') id: string,
    @Body() payload: HrTrainingDto,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    const user = request.user as User;
    
    // Extract and convert base64 certificate to file-like object if provided
    let trainingCertificate: any = undefined;
    if (payload.trainingCertificate && typeof payload.trainingCertificate === 'object' && 'file' in payload.trainingCertificate) {
      trainingCertificate = createAndValidateFileFromBase64(
        {
          file: payload.trainingCertificate.file,
          fileName: payload.trainingCertificate.fileName,
          fileSize: payload.trainingCertificate.fileSize,
          mimeType: payload.trainingCertificate.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      );
      // Remove from payload - service expects string (UUID) or undefined
      (payload as any).trainingCertificate = undefined;
    }
    
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
  @ApiConsumes('application/json')
  @Post('/operator/application/:applicationId/hr/experience')
  createExperience(
    @Param('applicationId') applicationId: string,
    @Body() payload: HrExperienceDto,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    const user = request.user as User;
    
    // Extract and convert base64 letter to file-like object if provided
    let experienceLetter: any = undefined;
    if (payload.experienceLetter && typeof payload.experienceLetter === 'object' && 'file' in payload.experienceLetter) {
      experienceLetter = createAndValidateFileFromBase64(
        {
          file: payload.experienceLetter.file,
          fileName: payload.experienceLetter.fileName,
          fileSize: payload.experienceLetter.fileSize,
          mimeType: payload.experienceLetter.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      );
      // Remove from payload - service expects string (UUID) or undefined
      (payload as any).experienceLetter = undefined;
    }
    
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
  @ApiConsumes('application/json')
  @Post('/operator/application/:applicationId/hr/experience/:id')
  updateExperience(
    @Param('applicationId') applicationId: string,
    @Param('id') id: string,
    @Body() payload: HrExperienceDto,
    @Request() request: any,
    @Query('hrInformationId') hrInformationId?: string,
  ) {
    const user = request.user as User;
    
    // Extract and convert base64 letter to file-like object if provided
    let experienceLetter: any = undefined;
    if (payload.experienceLetter && typeof payload.experienceLetter === 'object' && 'file' in payload.experienceLetter) {
      experienceLetter = createAndValidateFileFromBase64(
        {
          file: payload.experienceLetter.file,
          fileName: payload.experienceLetter.fileName,
          fileSize: payload.experienceLetter.fileSize,
          mimeType: payload.experienceLetter.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      );
      // Remove from payload - service expects string (UUID) or undefined
      (payload as any).experienceLetter = undefined;
    }
    
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
  @ApiConsumes('application/json')
  @Post('/operator/application/:applicationId/financial-information/others')
  saveOther(
    @Param('applicationId') applicationId: string,
    @Body() payload: OthersDto,
    @Request() request: any,
  ) {
    const user = request.user as User;
    
    // Extract and convert base64 document to file-like object if provided
    let documentFile: any = undefined;
    if (payload.document && typeof payload.document === 'object' && 'file' in payload.document) {
      documentFile = createAndValidateFileFromBase64(
        {
          file: payload.document.file,
          fileName: payload.document.fileName,
          fileSize: payload.document.fileSize,
          mimeType: payload.document.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      );
      // Remove from payload - service expects undefined for new files
      (payload as any).document = undefined;
    }
    
    return this.warehouseService.saveOther(applicationId, payload, user.id, undefined, documentFile);
  }

  @ApiOperation({ summary: 'Update an existing other document' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('application/json')
  @Post('/operator/application/:applicationId/financial-information/others/:id')
  updateOther(
    @Param('applicationId') applicationId: string,
    @Param('id') id: string,
    @Body() payload: OthersDto,
    @Request() request: any,
  ) {
    const user = request.user as User;
    
    // Extract and convert base64 document to file-like object if provided
    let documentFile: any = undefined;
    if (payload.document && typeof payload.document === 'object' && 'file' in payload.document) {
      documentFile = createAndValidateFileFromBase64(
        {
          file: payload.document.file,
          fileName: payload.document.fileName,
          fileSize: payload.document.fileSize,
          mimeType: payload.document.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      );
      // Remove from payload - service expects undefined for new files
      (payload as any).document = undefined;
    }
    
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
  @ApiConsumes('application/json')
  @ApiParam({ name: 'sectionType', enum: ['audit-report', 'tax-return', 'bank-statement', 'other'] })
  @Post('/operator/application/:applicationId/financial-information/:sectionType')
  saveFinancialSubsection(
    @Param('applicationId') applicationId: string,
    @Param('sectionType') sectionType: 'audit-report' | 'tax-return' | 'bank-statement' | 'other',
    @Body() body: FinancialSubsectionDto,
    @Request() request: any,
  ) {
    const user = request.user as User;
    const payload = body.data;

    // Convert base64 files to file-like objects
    let documentFile: any = undefined;
    if (body.documents && body.documents.length > 0) {
      if (sectionType === 'tax-return' || sectionType === 'audit-report') {
        // Multiple files for tax-return and audit-report
        documentFile = body.documents.map(doc => 
          createAndValidateFileFromBase64(
            {
              file: doc.file,
              fileName: doc.fileName,
              fileSize: doc.fileSize,
              mimeType: doc.mimeType,
            },
            10 * 1024 * 1024, // 10MB max
          )
        );
      } else {
        // Single file for other sections
        documentFile = createAndValidateFileFromBase64(
          {
            file: body.documents[0].file,
            fileName: body.documents[0].fileName,
            fileSize: body.documents[0].fileSize,
            mimeType: body.documents[0].mimeType,
          },
          10 * 1024 * 1024,
        );
      }
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
  @ApiConsumes('application/json')
  @ApiParam({ name: 'sectionType', enum: ['audit-report', 'tax-return', 'bank-statement', 'other'] })
  @Post('/operator/application/:applicationId/financial-information/:sectionType/:id')
  updateFinancialSubsection(
    @Param('applicationId') applicationId: string,
    @Param('sectionType') sectionType: 'audit-report' | 'tax-return' | 'bank-statement' | 'other',
    @Param('id') id: string,
    @Body() body: FinancialSubsectionDto,
    @Request() request: any,
  ) {
    const user = request.user as User;
    const payload = body.data;

    // Convert base64 files to file-like objects
    let documentFile: any = undefined;
    if (body.documents && body.documents.length > 0) {
      if (sectionType === 'tax-return' || sectionType === 'audit-report') {
        // Multiple files for tax-return and audit-report
        documentFile = body.documents.map(doc => 
          createAndValidateFileFromBase64(
            {
              file: doc.file,
              fileName: doc.fileName,
              fileSize: doc.fileSize,
              mimeType: doc.mimeType,
            },
            10 * 1024 * 1024, // 10MB max
          )
        );
      } else {
        // Single file for other sections
        documentFile = createAndValidateFileFromBase64(
          {
            file: body.documents[0].file,
            fileName: body.documents[0].fileName,
            fileSize: body.documents[0].fileSize,
            mimeType: body.documents[0].mimeType,
          },
          10 * 1024 * 1024,
        );
      }
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
    description: 'Submit applicant checklist with optional file uploads. Files are uploaded as base64 encoded JSON and linked to warehouse_documents table.'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('application/json')
  @ApiParam(ApplicantChecklistApiParam)
  @ApiBody({ type: CreateApplicantChecklistDto })
  @ApiResponse(ApplicantChecklistApiResponseSchema)
  @ApiResponse(ApplicantChecklistApiResponse400)
  @ApiResponse(ApplicantChecklistApiResponse401)
  @ApiResponse(ApplicantChecklistApiResponse404)
  @Post('/operator/application/:applicationId/applicant-checklist')
  createApplicantChecklist(
    @Param('applicationId') applicationId: string,
    @Body() payload: CreateApplicantChecklistDto,
    @Query('submit') submitParam?: string,
    @Request() request?: any,
  ) {
    const user = request?.user as User;
    if (!user) {
      throw new BadRequestException('User not found in request');
    }
    const submit = submitParam === 'true' || submitParam === '1';
    
    // Convert base64 files to file-like objects
    const files: {
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
    } = {};

    const fileFields = [
      'qcPersonnelFile',
      'warehouseSupervisorFile',
      'dataEntryOperatorFile',
      'auditedFinancialStatementsFile',
      'positiveNetWorthFile',
      'noLoanDefaultsFile',
      'cleanCreditHistoryFile',
      'adequateWorkingCapitalFile',
      'validInsuranceCoverageFile',
      'noFinancialFraudFile',
      'bankPaymentSlip',
    ];

    fileFields.forEach((field) => {
      const fileDto = (payload as any)[field];
      if (fileDto) {
        (files as any)[field] = [
          createAndValidateFileFromBase64(
            {
              file: fileDto.file,
              fileName: fileDto.fileName,
              fileSize: fileDto.fileSize,
              mimeType: fileDto.mimeType,
            },
            10 * 1024 * 1024, // 10MB max
          ),
        ];
      }
    });

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

  @Get('/documents/:id/download')
  @ApiOperation({ summary: 'Download warehouse document' })
  @ApiResponse({ status: 200, description: 'Document downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async downloadDocument(
    @Param('id') id: string,
    @Res() res: any,
  ) {
    const { buffer, mimeType, filename } = await this.warehouseService.downloadWarehouseDocument(id);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Frame-Options', 'DENY');

    res.send(buffer);
  }

  @ApiOperation({ summary: 'Submit unlock request for a warehouse operator application' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'applicationId', description: 'The ID of the warehouse operator application' })
  @ApiBody({ type: OperatorUnlockRequestDto })
  @Post('/operator/application/:applicationId/unlock-request')
  submitUnlockRequest(@Param('applicationId') applicationId: string, @Body() operatorUnlockRequestDto: OperatorUnlockRequestDto, @Request() request: any) {
    const user = request.user as User;
    return this.warehouseService.submitUnlockRequest(applicationId, operatorUnlockRequestDto, user.id);
  }

  @Get('/operator/application/unlock-requests')
  getUnlockRequests(@Request() request: any) {
    const user = request.user as User;
    return this.warehouseService.getUnlockRequests(user.id);
  }
}
