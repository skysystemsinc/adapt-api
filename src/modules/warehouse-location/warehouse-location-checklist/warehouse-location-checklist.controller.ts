import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, BadRequestException, Query } from '@nestjs/common';
import { WarehouseLocationChecklistService } from './warehouse-location-checklist.service';
import { CreateWarehouseLocationChecklistDto } from '../dto/create-warehouse-location-checklist.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { createAndValidateFileFromBase64 } from 'src/common/utils/file-utils';

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
  @ApiConsumes('application/json')
  @Post('/:id/key-submission-checklist')
  createWarehouseLocationChecklist(
    @Param('id') warehouseLocationId: string,
    @Body() payload: CreateWarehouseLocationChecklistDto,
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
    } = {};

    const fileFields = [
      'ownershipDeedFile', 'mutationDeedFile', 'nocNecFile', 'factoryLayoutFile',
      'leaseAgreementFile', 'propertyWarrantyFile', 'agreementUndertakingFile',
      'qcPersonnelFile', 'warehouseSupervisorFile', 'dataEntryOperatorFile',
      'warehouseOutsideFloodingAreaFile', 'securedBoundaryWallFile', 'reinforcedBarbedWireFile',
      'fullyGatedFile', 'securityGuards24x7File', 'cctvCamerasFile',
      'functionalWeighbridgeFile', 'samplingTestingAreaFile', 'calibratedInstrumentsFile',
      'functionalOfficeFile', 'operationalToiletsFile', 'electricityGasUtilitiesFile',
      'backupGeneratorFile', 'adequateResidentialArrangementsFile', 'axialAerationFansFile',
      'ventsExhaustFansFile', 'technicalDrawingFile', 'dryingFacilityFile',
      'temperatureSensorCablesFile', 'securedDoorsFile', 'plasteredFlooringFile',
      'plasteredWallsFile', 'intactCeilingFile', 'functionalWindowsFile',
      'protectiveNettingFile', 'functionalExhaustFansFile', 'freeFromPestsFile',
      'fireSafetyMeasuresFile', 'bankPaymentSlip',
    ];

    fileFields.forEach((field) => {
      const fileDto = (payload as any)[field];
      if (fileDto && typeof fileDto === 'object' && 'file' in fileDto) {
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
  @ApiConsumes('application/json')
  @Patch('/:id/key-submission-checklist')
  updateWarehouseLocationChecklist(
    @Param('id') warehouseLocationId: string,
    @Body() payload: CreateWarehouseLocationChecklistDto,
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
    } = {};

    const fileFields = [
      'ownershipDeedFile', 'mutationDeedFile', 'nocNecFile', 'factoryLayoutFile',
      'leaseAgreementFile', 'propertyWarrantyFile', 'agreementUndertakingFile',
      'qcPersonnelFile', 'warehouseSupervisorFile', 'dataEntryOperatorFile',
      'warehouseOutsideFloodingAreaFile', 'securedBoundaryWallFile', 'reinforcedBarbedWireFile',
      'fullyGatedFile', 'securityGuards24x7File', 'cctvCamerasFile',
      'functionalWeighbridgeFile', 'samplingTestingAreaFile', 'calibratedInstrumentsFile',
      'functionalOfficeFile', 'operationalToiletsFile', 'electricityGasUtilitiesFile',
      'backupGeneratorFile', 'adequateResidentialArrangementsFile', 'axialAerationFansFile',
      'ventsExhaustFansFile', 'technicalDrawingFile', 'dryingFacilityFile',
      'temperatureSensorCablesFile', 'securedDoorsFile', 'plasteredFlooringFile',
      'plasteredWallsFile', 'intactCeilingFile', 'functionalWindowsFile',
      'protectiveNettingFile', 'functionalExhaustFansFile', 'freeFromPestsFile',
      'fireSafetyMeasuresFile', 'bankPaymentSlip',
    ];

    fileFields.forEach((field) => {
      const fileDto = (payload as any)[field];
      if (fileDto && typeof fileDto === 'object' && 'file' in fileDto) {
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

    return this.warehouseLocationChecklistService.updateWarehouseLocationChecklist(
      warehouseLocationId,
      payload,
      user.id,
      files,
      submit,
    );
  }
}


