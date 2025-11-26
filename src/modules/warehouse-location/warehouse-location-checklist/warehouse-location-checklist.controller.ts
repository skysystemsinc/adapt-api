import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, UseInterceptors, UploadedFiles, BadRequestException, Query } from '@nestjs/common';
import { WarehouseLocationChecklistService } from './warehouse-location-checklist.service';
import { CreateWarehouseLocationChecklistDto } from '../dto/create-warehouse-location-checklist.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@ApiTags('Warehouse Location')
@ApiBearerAuth('JWT-auth')
@Controller('warehouse-location')
@UseGuards(JwtAuthGuard)
export class WarehouseLocationChecklistController {
  constructor(
    private readonly warehouseLocationChecklistService: WarehouseLocationChecklistService,
  ) {}

  @ApiOperation({ summary: 'Get warehouse location checklist for a warehouse location' })
  @ApiBearerAuth('JWT-auth')
  @Get('/:id/key-submission-checklist')
  getWarehouseLocationChecklist(
    @Param('id') warehouseLocationId: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseLocationChecklistService.getWarehouseLocationChecklist(warehouseLocationId, user.id);
  }

  @ApiOperation({ summary: 'Create or update warehouse location checklist' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        // Ownership & Legal Documents
        { name: 'ownershipDeedFile', maxCount: 1 },
        { name: 'mutationDeedFile', maxCount: 1 },
        { name: 'nocNecFile', maxCount: 1 },
        { name: 'factoryLayoutFile', maxCount: 1 },
        { name: 'leaseAgreementFile', maxCount: 1 },
        { name: 'propertyWarrantyFile', maxCount: 1 },
        { name: 'agreementUndertakingFile', maxCount: 1 },
        // Human Resources Key
        { name: 'qcPersonnelFile', maxCount: 1 },
        { name: 'warehouseSupervisorFile', maxCount: 1 },
        { name: 'dataEntryOperatorFile', maxCount: 1 },
        // Location & Risk
        { name: 'warehouseOutsideFloodingAreaFile', maxCount: 1 },
        // Security & Perimeter
        { name: 'securedBoundaryWallFile', maxCount: 1 },
        { name: 'reinforcedBarbedWireFile', maxCount: 1 },
        { name: 'fullyGatedFile', maxCount: 1 },
        { name: 'securityGuards24x7File', maxCount: 1 },
        { name: 'cctvCamerasFile', maxCount: 1 },
        // Infrastructure & Utilities
        { name: 'functionalWeighbridgeFile', maxCount: 1 },
        { name: 'samplingTestingAreaFile', maxCount: 1 },
        { name: 'calibratedInstrumentsFile', maxCount: 1 },
        { name: 'functionalOfficeFile', maxCount: 1 },
        { name: 'operationalToiletsFile', maxCount: 1 },
        { name: 'electricityGasUtilitiesFile', maxCount: 1 },
        { name: 'backupGeneratorFile', maxCount: 1 },
        { name: 'adequateResidentialArrangementsFile', maxCount: 1 },
        { name: 'axialAerationFansFile', maxCount: 1 },
        { name: 'ventsExhaustFansFile', maxCount: 1 },
        { name: 'technicalDrawingFile', maxCount: 1 },
        { name: 'dryingFacilityFile', maxCount: 1 },
        { name: 'temperatureSensorCablesFile', maxCount: 1 },
        // Storage Facilities
        { name: 'securedDoorsFile', maxCount: 1 },
        { name: 'plasteredFlooringFile', maxCount: 1 },
        { name: 'plasteredWallsFile', maxCount: 1 },
        { name: 'intactCeilingFile', maxCount: 1 },
        { name: 'functionalWindowsFile', maxCount: 1 },
        { name: 'protectiveNettingFile', maxCount: 1 },
        { name: 'functionalExhaustFansFile', maxCount: 1 },
        { name: 'freeFromPestsFile', maxCount: 1 },
        { name: 'fireSafetyMeasuresFile', maxCount: 1 },
        // Registration Fee
        { name: 'bankPaymentSlip', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB max per file
        },
      },
    ),
  )
  @Post('/:id/key-submission-checklist')
  createWarehouseLocationChecklist(
    @Param('id') warehouseLocationId: string,
    @Body('data') dataString: string,
    @Query('submit') submitParam?: string,
    @UploadedFiles() files?: {
      ownershipDeedFile?: any[];
      mutationDeedFile?: any[];
      nocNecFile?: any[];
      factoryLayoutFile?: any[];
      leaseAgreementFile?: any[];
      propertyWarrantyFile?: any[];
      agreementUndertakingFile?: any[];
      qcPersonnelFile?: any[];
      warehouseSupervisorFile?: any[];
      dataEntryOperatorFile?: any[];
      warehouseOutsideFloodingAreaFile?: any[];
      securedBoundaryWallFile?: any[];
      reinforcedBarbedWireFile?: any[];
      fullyGatedFile?: any[];
      securityGuards24x7File?: any[];
      cctvCamerasFile?: any[];
      functionalWeighbridgeFile?: any[];
      samplingTestingAreaFile?: any[];
      calibratedInstrumentsFile?: any[];
      functionalOfficeFile?: any[];
      operationalToiletsFile?: any[];
      electricityGasUtilitiesFile?: any[];
      backupGeneratorFile?: any[];
      adequateResidentialArrangementsFile?: any[];
      axialAerationFansFile?: any[];
      ventsExhaustFansFile?: any[];
      technicalDrawingFile?: any[];
      dryingFacilityFile?: any[];
      temperatureSensorCablesFile?: any[];
      securedDoorsFile?: any[];
      plasteredFlooringFile?: any[];
      plasteredWallsFile?: any[];
      intactCeilingFile?: any[];
      functionalWindowsFile?: any[];
      protectiveNettingFile?: any[];
      functionalExhaustFansFile?: any[];
      freeFromPestsFile?: any[];
      fireSafetyMeasuresFile?: any[];
      bankPaymentSlip?: any[];
    },
    @Request() request?: any,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: CreateWarehouseLocationChecklistDto;
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
    return this.warehouseLocationChecklistService.createWarehouseLocationChecklist(
      warehouseLocationId,
      payload,
      user.id,
      files,
      submit,
    );
  }

  @ApiOperation({ summary: 'Update warehouse location checklist' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        // Ownership & Legal Documents
        { name: 'ownershipDeedFile', maxCount: 1 },
        { name: 'mutationDeedFile', maxCount: 1 },
        { name: 'nocNecFile', maxCount: 1 },
        { name: 'factoryLayoutFile', maxCount: 1 },
        { name: 'leaseAgreementFile', maxCount: 1 },
        { name: 'propertyWarrantyFile', maxCount: 1 },
        { name: 'agreementUndertakingFile', maxCount: 1 },
        // Human Resources Key
        { name: 'qcPersonnelFile', maxCount: 1 },
        { name: 'warehouseSupervisorFile', maxCount: 1 },
        { name: 'dataEntryOperatorFile', maxCount: 1 },
        // Location & Risk
        { name: 'warehouseOutsideFloodingAreaFile', maxCount: 1 },
        // Security & Perimeter
        { name: 'securedBoundaryWallFile', maxCount: 1 },
        { name: 'reinforcedBarbedWireFile', maxCount: 1 },
        { name: 'fullyGatedFile', maxCount: 1 },
        { name: 'securityGuards24x7File', maxCount: 1 },
        { name: 'cctvCamerasFile', maxCount: 1 },
        // Infrastructure & Utilities
        { name: 'functionalWeighbridgeFile', maxCount: 1 },
        { name: 'samplingTestingAreaFile', maxCount: 1 },
        { name: 'calibratedInstrumentsFile', maxCount: 1 },
        { name: 'functionalOfficeFile', maxCount: 1 },
        { name: 'operationalToiletsFile', maxCount: 1 },
        { name: 'electricityGasUtilitiesFile', maxCount: 1 },
        { name: 'backupGeneratorFile', maxCount: 1 },
        { name: 'adequateResidentialArrangementsFile', maxCount: 1 },
        { name: 'axialAerationFansFile', maxCount: 1 },
        { name: 'ventsExhaustFansFile', maxCount: 1 },
        { name: 'technicalDrawingFile', maxCount: 1 },
        { name: 'dryingFacilityFile', maxCount: 1 },
        { name: 'temperatureSensorCablesFile', maxCount: 1 },
        // Storage Facilities
        { name: 'securedDoorsFile', maxCount: 1 },
        { name: 'plasteredFlooringFile', maxCount: 1 },
        { name: 'plasteredWallsFile', maxCount: 1 },
        { name: 'intactCeilingFile', maxCount: 1 },
        { name: 'functionalWindowsFile', maxCount: 1 },
        { name: 'protectiveNettingFile', maxCount: 1 },
        { name: 'functionalExhaustFansFile', maxCount: 1 },
        { name: 'freeFromPestsFile', maxCount: 1 },
        { name: 'fireSafetyMeasuresFile', maxCount: 1 },
        // Registration Fee
        { name: 'bankPaymentSlip', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB max per file
        },
      },
    ),
  )
  @Patch('/:id/key-submission-checklist')
  updateWarehouseLocationChecklist(
    @Param('id') warehouseLocationId: string,
    @Body('data') dataString: string,
    @Query('submit') submitParam?: string,
    @UploadedFiles() files?: {
      ownershipDeedFile?: any[];
      mutationDeedFile?: any[];
      nocNecFile?: any[];
      factoryLayoutFile?: any[];
      leaseAgreementFile?: any[];
      propertyWarrantyFile?: any[];
      agreementUndertakingFile?: any[];
      qcPersonnelFile?: any[];
      warehouseSupervisorFile?: any[];
      dataEntryOperatorFile?: any[];
      warehouseOutsideFloodingAreaFile?: any[];
      securedBoundaryWallFile?: any[];
      reinforcedBarbedWireFile?: any[];
      fullyGatedFile?: any[];
      securityGuards24x7File?: any[];
      cctvCamerasFile?: any[];
      functionalWeighbridgeFile?: any[];
      samplingTestingAreaFile?: any[];
      calibratedInstrumentsFile?: any[];
      functionalOfficeFile?: any[];
      operationalToiletsFile?: any[];
      electricityGasUtilitiesFile?: any[];
      backupGeneratorFile?: any[];
      adequateResidentialArrangementsFile?: any[];
      axialAerationFansFile?: any[];
      ventsExhaustFansFile?: any[];
      technicalDrawingFile?: any[];
      dryingFacilityFile?: any[];
      temperatureSensorCablesFile?: any[];
      securedDoorsFile?: any[];
      plasteredFlooringFile?: any[];
      plasteredWallsFile?: any[];
      intactCeilingFile?: any[];
      functionalWindowsFile?: any[];
      protectiveNettingFile?: any[];
      functionalExhaustFansFile?: any[];
      freeFromPestsFile?: any[];
      fireSafetyMeasuresFile?: any[];
      bankPaymentSlip?: any[];
    },
    @Request() request?: any,
  ) {
    if (!dataString) {
      throw new BadRequestException('Data field is required');
    }

    let payload: CreateWarehouseLocationChecklistDto;
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
    return this.warehouseLocationChecklistService.updateWarehouseLocationChecklist(
      warehouseLocationId,
      payload,
      user.id,
      files,
      submit,
    );
  }
}


