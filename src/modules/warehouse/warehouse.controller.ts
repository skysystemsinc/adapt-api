import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateBankDetailsDto, CreateCompanyInformationRequestDto, CreateWarehouseOperatorApplicationRequestDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateBankDetailsDto } from './dto/create-bank-details.dto';
import { UpsertHrInformationDto } from './dto/create-hr-information.dto';

@ApiTags('Warehouse')
@ApiBearerAuth('JWT-auth')
@Controller('warehouse')
@UseGuards(JwtAuthGuard)
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly authService: AuthService
  ) { }

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
        fileSize: 100 * 1024 * 1024, // 100MB max
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
  @ApiBody({ type: UpsertHrInformationDto })
  @Post('/operator/application/:applicationId/hr-information')
  upsertHrInformation(
    @Param('applicationId') applicationId: string,
    @Body() payload: UpsertHrInformationDto,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseService.upsertHrInformation(applicationId, payload, user.id);
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

  @Get()
  findAll() {
    return this.warehouseService.findAll();
  }

  @Get('/operator')
  findOneWarehouseOperator(@Request() request: any) {
    const user = request.user as User;
    return this.warehouseService.findOneWarehouseOperator(user.id);
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
