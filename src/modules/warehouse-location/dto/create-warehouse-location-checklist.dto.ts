import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { RegistrationFeeChecklistDto, DeclarationChecklistDto } from '../../warehouse/dto/create-applicant-checklist.dto';

export class OwnershipLegalDocumentsDto {
  @ApiProperty({ type: Boolean, description: 'Whether ownership deed is submitted', example: true })
  @IsBoolean()
  @IsNotEmpty()
  ownershipDeed!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for ownership deed (required if ownershipDeed is true)' })
  @ValidateIf((o) => o.ownershipDeed === true)
  @IsNotEmpty({ message: 'ownershipDeedFile is required when ownershipDeed is true' })
  @IsUUID(undefined, { message: 'ownershipDeedFile must be a valid UUID' })
  ownershipDeedFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether mutation deed is submitted', example: true })
  @IsBoolean()
  @IsNotEmpty()
  mutationDeed!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for mutation deed (required if mutationDeed is true)' })
  @ValidateIf((o) => o.mutationDeed === true)
  @IsNotEmpty({ message: 'mutationDeedFile is required when mutationDeed is true' })
  @IsUUID(undefined, { message: 'mutationDeedFile must be a valid UUID' })
  mutationDeedFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether NOCs/NECs are submitted', example: true })
  @IsBoolean()
  @IsNotEmpty()
  nocNec!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for NOCs/NECs (required if nocNec is true)' })
  @ValidateIf((o) => o.nocNec === true)
  @IsNotEmpty({ message: 'nocNecFile is required when nocNec is true' })
  @IsUUID(undefined, { message: 'nocNecFile must be a valid UUID' })
  nocNecFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether factory layout and Aks Shajra are submitted', example: true })
  @IsBoolean()
  @IsNotEmpty()
  factoryLayout!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for factory layout (required if factoryLayout is true)' })
  @ValidateIf((o) => o.factoryLayout === true)
  @IsNotEmpty({ message: 'factoryLayoutFile is required when factoryLayout is true' })
  @IsUUID(undefined, { message: 'factoryLayoutFile must be a valid UUID' })
  factoryLayoutFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether lease agreement is submitted (only for rental property)', example: false })
  @IsBoolean()
  @IsNotEmpty()
  leaseAgreement!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for lease agreement (required if leaseAgreement is true)' })
  @ValidateIf((o) => o.leaseAgreement === true)
  @IsNotEmpty({ message: 'leaseAgreementFile is required when leaseAgreement is true' })
  @IsUUID(undefined, { message: 'leaseAgreementFile must be a valid UUID' })
  leaseAgreementFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether property warranty is submitted (only for rental property)', example: false })
  @IsBoolean()
  @IsNotEmpty()
  propertyWarranty!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for property warranty (required if propertyWarranty is true)' })
  @ValidateIf((o) => o.propertyWarranty === true)
  @IsNotEmpty({ message: 'propertyWarrantyFile is required when propertyWarranty is true' })
  @IsUUID(undefined, { message: 'propertyWarrantyFile must be a valid UUID' })
  propertyWarrantyFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether forms, affidavits, indemnities, agreements and undertaking are submitted', example: true })
  @IsBoolean()
  @IsNotEmpty()
  agreementUndertaking!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for agreement undertaking (required if agreementUndertaking is true)' })
  @ValidateIf((o) => o.agreementUndertaking === true)
  @IsNotEmpty({ message: 'agreementUndertakingFile is required when agreementUndertaking is true' })
  @IsUUID(undefined, { message: 'agreementUndertakingFile must be a valid UUID' })
  agreementUndertakingFile?: string;
}

export class HumanResourcesKeyDto {
  @ApiProperty({ type: Boolean, description: 'Whether QC personnel is available', example: true })
  @IsBoolean()
  @IsNotEmpty()
  qcPersonnel!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for QC personnel certificate (required if qcPersonnel is true)' })
  @ValidateIf((o) => o.qcPersonnel === true)
  @IsNotEmpty({ message: 'qcPersonnelFile is required when qcPersonnel is true' })
  @IsUUID(undefined, { message: 'qcPersonnelFile must be a valid UUID' })
  qcPersonnelFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether warehouse supervisor is available', example: true })
  @IsBoolean()
  @IsNotEmpty()
  warehouseSupervisor!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for warehouse supervisor certificate (required if warehouseSupervisor is true)' })
  @ValidateIf((o) => o.warehouseSupervisor === true)
  @IsNotEmpty({ message: 'warehouseSupervisorFile is required when warehouseSupervisor is true' })
  @IsUUID(undefined, { message: 'warehouseSupervisorFile must be a valid UUID' })
  warehouseSupervisorFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether data entry operator is available', example: true })
  @IsBoolean()
  @IsNotEmpty()
  dataEntryOperator!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for data entry operator certificate (required if dataEntryOperator is true)' })
  @ValidateIf((o) => o.dataEntryOperator === true)
  @IsNotEmpty({ message: 'dataEntryOperatorFile is required when dataEntryOperator is true' })
  @IsUUID(undefined, { message: 'dataEntryOperatorFile must be a valid UUID' })
  dataEntryOperatorFile?: string;
}

export class LocationRiskDto {
  @ApiProperty({ type: Boolean, description: 'Whether warehouse is located outside flooding area', example: true })
  @IsBoolean()
  @IsNotEmpty()
  warehouseOutsideFloodingArea!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for location proof (required if warehouseOutsideFloodingArea is true)' })
  @ValidateIf((o) => o.warehouseOutsideFloodingArea === true)
  @IsNotEmpty({ message: 'warehouseOutsideFloodingAreaFile is required when warehouseOutsideFloodingArea is true' })
  @IsUUID(undefined, { message: 'warehouseOutsideFloodingAreaFile must be a valid UUID' })
  warehouseOutsideFloodingAreaFile?: string;
}

export class SecurityPerimeterDto {
  @ApiProperty({ type: Boolean, description: 'Whether warehouse has secured boundary wall', example: true })
  @IsBoolean()
  @IsNotEmpty()
  securedBoundaryWall!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for boundary wall verification (required if securedBoundaryWall is true)' })
  @ValidateIf((o) => o.securedBoundaryWall === true)
  @IsNotEmpty({ message: 'securedBoundaryWallFile is required when securedBoundaryWall is true' })
  @IsUUID(undefined, { message: 'securedBoundaryWallFile must be a valid UUID' })
  securedBoundaryWallFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether boundary wall is reinforced with barbed wire', example: true })
  @IsBoolean()
  @IsNotEmpty()
  reinforcedBarbedWire!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for barbed wire photos (required if reinforcedBarbedWire is true)' })
  @ValidateIf((o) => o.reinforcedBarbedWire === true)
  @IsNotEmpty({ message: 'reinforcedBarbedWireFile is required when reinforcedBarbedWire is true' })
  @IsUUID(undefined, { message: 'reinforcedBarbedWireFile must be a valid UUID' })
  reinforcedBarbedWireFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether premises are fully gated', example: true })
  @IsBoolean()
  @IsNotEmpty()
  fullyGated!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for gate photos (required if fullyGated is true)' })
  @ValidateIf((o) => o.fullyGated === true)
  @IsNotEmpty({ message: 'fullyGatedFile is required when fullyGated is true' })
  @IsUUID(undefined, { message: 'fullyGatedFile must be a valid UUID' })
  fullyGatedFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether security guards are deployed 24/7', example: true })
  @IsBoolean()
  @IsNotEmpty()
  securityGuards24x7!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for security guard deployment proof (required if securityGuards24x7 is true)' })
  @ValidateIf((o) => o.securityGuards24x7 === true)
  @IsNotEmpty({ message: 'securityGuards24x7File is required when securityGuards24x7 is true' })
  @IsUUID(undefined, { message: 'securityGuards24x7File must be a valid UUID' })
  securityGuards24x7File?: string;

  @ApiProperty({ type: Boolean, description: 'Whether CCTV cameras are installed and functional', example: true })
  @IsBoolean()
  @IsNotEmpty()
  cctvCameras!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for CCTV proof (required if cctvCameras is true)' })
  @ValidateIf((o) => o.cctvCameras === true)
  @IsNotEmpty({ message: 'cctvCamerasFile is required when cctvCameras is true' })
  @IsUUID(undefined, { message: 'cctvCamerasFile must be a valid UUID' })
  cctvCamerasFile?: string;
}

export class InfrastructureUtilitiesDto {
  @ApiProperty({ type: Boolean, description: 'Whether functional weighbridge is available', example: true })
  @IsBoolean()
  @IsNotEmpty()
  functionalWeighbridge!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for weighbridge certificate (required if functionalWeighbridge is true)' })
  @ValidateIf((o) => o.functionalWeighbridge === true)
  @IsNotEmpty({ message: 'functionalWeighbridgeFile is required when functionalWeighbridge is true' })
  @IsUUID(undefined, { message: 'functionalWeighbridgeFile must be a valid UUID' })
  functionalWeighbridgeFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether sampling and testing area exists', example: true })
  @IsBoolean()
  @IsNotEmpty()
  samplingTestingArea!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for sampling area proof (required if samplingTestingArea is true)' })
  @ValidateIf((o) => o.samplingTestingArea === true)
  @IsNotEmpty({ message: 'samplingTestingAreaFile is required when samplingTestingArea is true' })
  @IsUUID(undefined, { message: 'samplingTestingAreaFile must be a valid UUID' })
  samplingTestingAreaFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether laboratory instruments are functional and calibrated', example: true })
  @IsBoolean()
  @IsNotEmpty()
  calibratedInstruments!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for calibration certificates (required if calibratedInstruments is true)' })
  @ValidateIf((o) => o.calibratedInstruments === true)
  @IsNotEmpty({ message: 'calibratedInstrumentsFile is required when calibratedInstruments is true' })
  @IsUUID(undefined, { message: 'calibratedInstrumentsFile must be a valid UUID' })
  calibratedInstrumentsFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether functional office area and security room are available', example: true })
  @IsBoolean()
  @IsNotEmpty()
  functionalOffice!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for office area proof (required if functionalOffice is true)' })
  @ValidateIf((o) => o.functionalOffice === true)
  @IsNotEmpty({ message: 'functionalOfficeFile is required when functionalOffice is true' })
  @IsUUID(undefined, { message: 'functionalOfficeFile must be a valid UUID' })
  functionalOfficeFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether toilets/washrooms are operational', example: true })
  @IsBoolean()
  @IsNotEmpty()
  operationalToilets!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for toilets proof (required if operationalToilets is true)' })
  @ValidateIf((o) => o.operationalToilets === true)
  @IsNotEmpty({ message: 'operationalToiletsFile is required when operationalToilets is true' })
  @IsUUID(undefined, { message: 'operationalToiletsFile must be a valid UUID' })
  operationalToiletsFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether electricity and gas utilities are available', example: true })
  @IsBoolean()
  @IsNotEmpty()
  electricityGasUtilities!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for utility bills (required if electricityGasUtilities is true)' })
  @ValidateIf((o) => o.electricityGasUtilities === true)
  @IsNotEmpty({ message: 'electricityGasUtilitiesFile is required when electricityGasUtilities is true' })
  @IsUUID(undefined, { message: 'electricityGasUtilitiesFile must be a valid UUID' })
  electricityGasUtilitiesFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether backup generator is installed and operational', example: true })
  @IsBoolean()
  @IsNotEmpty()
  backupGenerator!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for generator proof (required if backupGenerator is true)' })
  @ValidateIf((o) => o.backupGenerator === true)
  @IsNotEmpty({ message: 'backupGeneratorFile is required when backupGenerator is true' })
  @IsUUID(undefined, { message: 'backupGeneratorFile must be a valid UUID' })
  backupGeneratorFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether adequate residential arrangements are available', example: true })
  @IsBoolean()
  @IsNotEmpty()
  adequateResidentialArrangements!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for residential arrangements proof (required if adequateResidentialArrangements is true)' })
  @ValidateIf((o) => o.adequateResidentialArrangements === true)
  @IsNotEmpty({ message: 'adequateResidentialArrangementsFile is required when adequateResidentialArrangements is true' })
  @IsUUID(undefined, { message: 'adequateResidentialArrangementsFile must be a valid UUID' })
  adequateResidentialArrangementsFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether axial/aeration fans are installed (only for grain silos)', example: false })
  @IsBoolean()
  @IsNotEmpty()
  axialAerationFans!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for axial fans proof (required if axialAerationFans is true)' })
  @ValidateIf((o) => o.axialAerationFans === true)
  @IsNotEmpty({ message: 'axialAerationFansFile is required when axialAerationFans is true' })
  @IsUUID(undefined, { message: 'axialAerationFansFile must be a valid UUID' })
  axialAerationFansFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether vents and exhaust fans on top of silos are installed (only for grain silos)', example: false })
  @IsBoolean()
  @IsNotEmpty()
  ventsExhaustFans!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for vents/exhaust fans proof (required if ventsExhaustFans is true)' })
  @ValidateIf((o) => o.ventsExhaustFans === true)
  @IsNotEmpty({ message: 'ventsExhaustFansFile is required when ventsExhaustFans is true' })
  @IsUUID(undefined, { message: 'ventsExhaustFansFile must be a valid UUID' })
  ventsExhaustFansFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether technical drawing with measurements is available (only for grain silos)', example: false })
  @IsBoolean()
  @IsNotEmpty()
  technicalDrawing!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for technical drawing (required if technicalDrawing is true)' })
  @ValidateIf((o) => o.technicalDrawing === true)
  @IsNotEmpty({ message: 'technicalDrawingFile is required when technicalDrawing is true' })
  @IsUUID(undefined, { message: 'technicalDrawingFile must be a valid UUID' })
  technicalDrawingFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether drying facility is installed and available (only for grain silos)', example: false })
  @IsBoolean()
  @IsNotEmpty()
  dryingFacility!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for drying facility proof (required if dryingFacility is true)' })
  @ValidateIf((o) => o.dryingFacility === true)
  @IsNotEmpty({ message: 'dryingFacilityFile is required when dryingFacility is true' })
  @IsUUID(undefined, { message: 'dryingFacilityFile must be a valid UUID' })
  dryingFacilityFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether temperature sensor cables are installed and 70% are working (only for grain silos)', example: false })
  @IsBoolean()
  @IsNotEmpty()
  temperatureSensorCables!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for temperature sensor proof (required if temperatureSensorCables is true)' })
  @ValidateIf((o) => o.temperatureSensorCables === true)
  @IsNotEmpty({ message: 'temperatureSensorCablesFile is required when temperatureSensorCables is true' })
  @IsUUID(undefined, { message: 'temperatureSensorCablesFile must be a valid UUID' })
  temperatureSensorCablesFile?: string;
}

export class StorageFacilitiesDto {
  @ApiProperty({ type: Boolean, description: 'Whether storage area doors are secured', example: true })
  @IsBoolean()
  @IsNotEmpty()
  securedDoors!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for secured doors proof (required if securedDoors is true)' })
  @ValidateIf((o) => o.securedDoors === true)
  @IsNotEmpty({ message: 'securedDoorsFile is required when securedDoors is true' })
  @IsUUID(undefined, { message: 'securedDoorsFile must be a valid UUID' })
  securedDoorsFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether flooring is plastered, non-slippery, smooth, and free of potholes', example: true })
  @IsBoolean()
  @IsNotEmpty()
  plasteredFlooring!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for flooring proof (required if plasteredFlooring is true)' })
  @ValidateIf((o) => o.plasteredFlooring === true)
  @IsNotEmpty({ message: 'plasteredFlooringFile is required when plasteredFlooring is true' })
  @IsUUID(undefined, { message: 'plasteredFlooringFile must be a valid UUID' })
  plasteredFlooringFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether walls are plastered and painted', example: true })
  @IsBoolean()
  @IsNotEmpty()
  plasteredWalls!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for walls proof (required if plasteredWalls is true)' })
  @ValidateIf((o) => o.plasteredWalls === true)
  @IsNotEmpty({ message: 'plasteredWallsFile is required when plasteredWalls is true' })
  @IsUUID(undefined, { message: 'plasteredWallsFile must be a valid UUID' })
  plasteredWallsFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether ceiling is intact and free of leakage', example: true })
  @IsBoolean()
  @IsNotEmpty()
  intactCeiling!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for ceiling proof (required if intactCeiling is true)' })
  @ValidateIf((o) => o.intactCeiling === true)
  @IsNotEmpty({ message: 'intactCeilingFile is required when intactCeiling is true' })
  @IsUUID(undefined, { message: 'intactCeilingFile must be a valid UUID' })
  intactCeilingFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether windows and ventilators are installed and functional', example: true })
  @IsBoolean()
  @IsNotEmpty()
  functionalWindows!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for windows proof (required if functionalWindows is true)' })
  @ValidateIf((o) => o.functionalWindows === true)
  @IsNotEmpty({ message: 'functionalWindowsFile is required when functionalWindows is true' })
  @IsUUID(undefined, { message: 'functionalWindowsFile must be a valid UUID' })
  functionalWindowsFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether protective netting is installed on windows and ventilators', example: true })
  @IsBoolean()
  @IsNotEmpty()
  protectiveNetting!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for protective netting proof (required if protectiveNetting is true)' })
  @ValidateIf((o) => o.protectiveNetting === true)
  @IsNotEmpty({ message: 'protectiveNettingFile is required when protectiveNetting is true' })
  @IsUUID(undefined, { message: 'protectiveNettingFile must be a valid UUID' })
  protectiveNettingFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether exhaust fans are installed and functional', example: true })
  @IsBoolean()
  @IsNotEmpty()
  functionalExhaustFans!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for exhaust fans proof (required if functionalExhaustFans is true)' })
  @ValidateIf((o) => o.functionalExhaustFans === true)
  @IsNotEmpty({ message: 'functionalExhaustFansFile is required when functionalExhaustFans is true' })
  @IsUUID(undefined, { message: 'functionalExhaustFansFile must be a valid UUID' })
  functionalExhaustFansFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether warehouse is free from termites, pests, and infestations', example: true })
  @IsBoolean()
  @IsNotEmpty()
  freeFromPests!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for pest control certificate (required if freeFromPests is true)' })
  @ValidateIf((o) => o.freeFromPests === true)
  @IsNotEmpty({ message: 'freeFromPestsFile is required when freeFromPests is true' })
  @IsUUID(undefined, { message: 'freeFromPestsFile must be a valid UUID' })
  freeFromPestsFile?: string;

  @ApiProperty({ type: Boolean, description: 'Whether fire safety measures are in place and functional', example: true })
  @IsBoolean()
  @IsNotEmpty()
  fireSafetyMeasures!: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Document ID for fire safety proof (required if fireSafetyMeasures is true)' })
  @ValidateIf((o) => o.fireSafetyMeasures === true)
  @IsNotEmpty({ message: 'fireSafetyMeasuresFile is required when fireSafetyMeasures is true' })
  @IsUUID(undefined, { message: 'fireSafetyMeasuresFile must be a valid UUID' })
  fireSafetyMeasuresFile?: string;
}

export class CreateWarehouseLocationChecklistDto {
  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'ID of existing warehouse location checklist (for updates)' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ type: OwnershipLegalDocumentsDto, description: 'Ownership and legal documents checklist information' })
  @ValidateNested()
  @Type(() => OwnershipLegalDocumentsDto)
  ownershipLegalDocuments!: OwnershipLegalDocumentsDto;

  @ApiProperty({ type: HumanResourcesKeyDto, description: 'Human resources checklist information' })
  @ValidateNested()
  @Type(() => HumanResourcesKeyDto)
  humanResourcesKey!: HumanResourcesKeyDto;

  @ApiProperty({ type: LocationRiskDto, description: 'Location and risk checklist information' })
  @ValidateNested()
  @Type(() => LocationRiskDto)
  locationRisk!: LocationRiskDto;

  @ApiProperty({ type: SecurityPerimeterDto, description: 'Security and perimeter control checklist information' })
  @ValidateNested()
  @Type(() => SecurityPerimeterDto)
  securityPerimeter!: SecurityPerimeterDto;

  @ApiProperty({ type: InfrastructureUtilitiesDto, description: 'Infrastructure and utilities checklist information' })
  @ValidateNested()
  @Type(() => InfrastructureUtilitiesDto)
  infrastructureUtilities!: InfrastructureUtilitiesDto;

  @ApiProperty({ type: StorageFacilitiesDto, description: 'Storage facilities checklist information' })
  @ValidateNested()
  @Type(() => StorageFacilitiesDto)
  storageFacilities!: StorageFacilitiesDto;

  @ApiProperty({ type: RegistrationFeeChecklistDto, description: 'Registration fee checklist information' })
  @ValidateNested()
  @Type(() => RegistrationFeeChecklistDto)
  registrationFee!: RegistrationFeeChecklistDto;

  @ApiProperty({ type: DeclarationChecklistDto, description: 'Declaration checklist information' })
  @ValidateNested()
  @Type(() => DeclarationChecklistDto)
  declaration!: DeclarationChecklistDto;
}


