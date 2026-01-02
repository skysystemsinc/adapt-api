import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { RegistrationFeeChecklistDto, DeclarationChecklistDto } from '../../warehouse/dto/create-applicant-checklist.dto';

export class OwnershipLegalDocumentsDto {
  @ApiProperty({ type: Boolean, description: 'Whether ownership deed is submitted', example: true })
  @IsBoolean()
  @IsNotEmpty()
  ownershipDeed!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for ownership deed (required if ownershipDeed is true)' })
  @ValidateIf((o) => o.ownershipDeed === true)
  @IsNotEmpty({ message: 'ownershipDeedFile is required when ownershipDeed is true' })
  @IsString()
  ownershipDeedFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for ownership deed (required if ownershipDeedFile is base64)' })
  @IsOptional()
  @IsString()
  ownershipDeedFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for ownership deed (required if ownershipDeedFile is base64)' })
  @IsOptional()
  @IsString()
  ownershipDeedFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether mutation deed is submitted', example: true })
  @IsBoolean()
  @IsNotEmpty()
  mutationDeed!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for mutation deed (required if mutationDeed is true)' })
  @ValidateIf((o) => o.mutationDeed === true)
  @IsNotEmpty({ message: 'mutationDeedFile is required when mutationDeed is true' })
  @IsString()
  mutationDeedFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for mutation deed (required if mutationDeedFile is base64)' })
  @IsOptional()
  @IsString()
  mutationDeedFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for mutation deed (required if mutationDeedFile is base64)' })
  @IsOptional()
  @IsString()
  mutationDeedFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether NOCs/NECs are submitted', example: true })
  @IsBoolean()
  @IsNotEmpty()
  nocNec!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for NOCs/NECs (required if nocNec is true)' })
  @ValidateIf((o) => o.nocNec === true)
  @IsNotEmpty({ message: 'nocNecFile is required when nocNec is true' })
  @IsString()
  nocNecFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for NOCs/NECs (required if nocNecFile is base64)' })
  @IsOptional()
  @IsString()
  nocNecFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for NOCs/NECs (required if nocNecFile is base64)' })
  @IsOptional()
  @IsString()
  nocNecFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether factory layout and Aks Shajra are submitted', example: true })
  @IsBoolean()
  @IsNotEmpty()
  factoryLayout!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for factory layout (required if factoryLayout is true)' })
  @ValidateIf((o) => o.factoryLayout === true)
  @IsNotEmpty({ message: 'factoryLayoutFile is required when factoryLayout is true' })
  @IsString()
  factoryLayoutFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for factory layout (required if factoryLayoutFile is base64)' })
  @IsOptional()
  @IsString()
  factoryLayoutFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for factory layout (required if factoryLayoutFile is base64)' })
  @IsOptional()
  @IsString()
  factoryLayoutFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether lease agreement is submitted (only for rental property)', example: false })
  @IsBoolean()
  @IsNotEmpty()
  leaseAgreement!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for lease agreement (required if leaseAgreement is true)' })
  @ValidateIf((o) => o.leaseAgreement === true)
  @IsNotEmpty({ message: 'leaseAgreementFile is required when leaseAgreement is true' })
  @IsString()
  leaseAgreementFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for lease agreement (required if leaseAgreementFile is base64)' })
  @IsOptional()
  @IsString()
  leaseAgreementFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for lease agreement (required if leaseAgreementFile is base64)' })
  @IsOptional()
  @IsString()
  leaseAgreementFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether property warranty is submitted (only for rental property)', example: false })
  @IsBoolean()
  @IsNotEmpty()
  propertyWarranty!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for property warranty (required if propertyWarranty is true)' })
  @ValidateIf((o) => o.propertyWarranty === true)
  @IsNotEmpty({ message: 'propertyWarrantyFile is required when propertyWarranty is true' })
  @IsString()
  propertyWarrantyFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for property warranty (required if propertyWarrantyFile is base64)' })
  @IsOptional()
  @IsString()
  propertyWarrantyFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for property warranty (required if propertyWarrantyFile is base64)' })
  @IsOptional()
  @IsString()
  propertyWarrantyFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether forms, affidavits, indemnities, agreements and undertaking are submitted', example: true })
  @IsBoolean()
  @IsNotEmpty()
  agreementUndertaking!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for agreement undertaking (required if agreementUndertaking is true)' })
  @ValidateIf((o) => o.agreementUndertaking === true)
  @IsNotEmpty({ message: 'agreementUndertakingFile is required when agreementUndertaking is true' })
  @IsString()
  agreementUndertakingFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for agreement undertaking (required if agreementUndertakingFile is base64)' })
  @IsOptional()
  @IsString()
  agreementUndertakingFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for agreement undertaking (required if agreementUndertakingFile is base64)' })
  @IsOptional()
  @IsString()
  agreementUndertakingFileMimeType?: string;
}

export class HumanResourcesKeyDto {
  @ApiProperty({ type: Boolean, description: 'Whether QC personnel is available', example: true })
  @IsBoolean()
  @IsNotEmpty()
  qcPersonnel!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for QC personnel certificate (required if qcPersonnel is true)' })
  @ValidateIf((o) => o.qcPersonnel === true)
  @IsNotEmpty({ message: 'qcPersonnelFile is required when qcPersonnel is true' })
  @IsString()
  qcPersonnelFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for QC personnel (required if qcPersonnelFile is base64)' })
  @IsOptional()
  @IsString()
  qcPersonnelFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for QC personnel (required if qcPersonnelFile is base64)' })
  @IsOptional()
  @IsString()
  qcPersonnelFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether warehouse supervisor is available', example: true })
  @IsBoolean()
  @IsNotEmpty()
  warehouseSupervisor!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for warehouse supervisor certificate (required if warehouseSupervisor is true)' })
  @ValidateIf((o) => o.warehouseSupervisor === true)
  @IsNotEmpty({ message: 'warehouseSupervisorFile is required when warehouseSupervisor is true' })
  @IsString()
  warehouseSupervisorFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for warehouse supervisor (required if warehouseSupervisorFile is base64)' })
  @IsOptional()
  @IsString()
  warehouseSupervisorFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for warehouse supervisor (required if warehouseSupervisorFile is base64)' })
  @IsOptional()
  @IsString()
  warehouseSupervisorFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether data entry operator is available', example: true })
  @IsBoolean()
  @IsNotEmpty()
  dataEntryOperator!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for data entry operator certificate (required if dataEntryOperator is true)' })
  @ValidateIf((o) => o.dataEntryOperator === true)
  @IsNotEmpty({ message: 'dataEntryOperatorFile is required when dataEntryOperator is true' })
  @IsString()
  dataEntryOperatorFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for data entry operator (required if dataEntryOperatorFile is base64)' })
  @IsOptional()
  @IsString()
  dataEntryOperatorFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for data entry operator (required if dataEntryOperatorFile is base64)' })
  @IsOptional()
  @IsString()
  dataEntryOperatorFileMimeType?: string;
}

export class LocationRiskDto {
  @ApiProperty({ type: Boolean, description: 'Whether warehouse is located outside flooding area', example: true })
  @IsBoolean()
  @IsNotEmpty()
  warehouseOutsideFloodingArea!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for location proof (required if warehouseOutsideFloodingArea is true)' })
  @ValidateIf((o) => o.warehouseOutsideFloodingArea === true)
  @IsNotEmpty({ message: 'warehouseOutsideFloodingAreaFile is required when warehouseOutsideFloodingArea is true' })
  @IsString()
  warehouseOutsideFloodingAreaFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for location proof (required if warehouseOutsideFloodingAreaFile is base64)' })
  @IsOptional()
  @IsString()
  warehouseOutsideFloodingAreaFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for location proof (required if warehouseOutsideFloodingAreaFile is base64)' })
  @IsOptional()
  @IsString()
  warehouseOutsideFloodingAreaFileMimeType?: string;
}

export class SecurityPerimeterDto {
  @ApiProperty({ type: Boolean, description: 'Whether warehouse has secured boundary wall', example: true })
  @IsBoolean()
  @IsNotEmpty()
  securedBoundaryWall!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for boundary wall verification (required if securedBoundaryWall is true)' })
  @ValidateIf((o) => o.securedBoundaryWall === true)
  @IsNotEmpty({ message: 'securedBoundaryWallFile is required when securedBoundaryWall is true' })
  @IsString()
  securedBoundaryWallFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for boundary wall (required if securedBoundaryWallFile is base64)' })
  @IsOptional()
  @IsString()
  securedBoundaryWallFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for boundary wall (required if securedBoundaryWallFile is base64)' })
  @IsOptional()
  @IsString()
  securedBoundaryWallFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether boundary wall is reinforced with barbed wire', example: true })
  @IsBoolean()
  @IsNotEmpty()
  reinforcedBarbedWire!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for barbed wire photos (required if reinforcedBarbedWire is true)' })
  @ValidateIf((o) => o.reinforcedBarbedWire === true)
  @IsNotEmpty({ message: 'reinforcedBarbedWireFile is required when reinforcedBarbedWire is true' })
  @IsString()
  reinforcedBarbedWireFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for barbed wire (required if reinforcedBarbedWireFile is base64)' })
  @IsOptional()
  @IsString()
  reinforcedBarbedWireFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for barbed wire (required if reinforcedBarbedWireFile is base64)' })
  @IsOptional()
  @IsString()
  reinforcedBarbedWireFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether premises are fully gated', example: true })
  @IsBoolean()
  @IsNotEmpty()
  fullyGated!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for gate photos (required if fullyGated is true)' })
  @ValidateIf((o) => o.fullyGated === true)
  @IsNotEmpty({ message: 'fullyGatedFile is required when fullyGated is true' })
  @IsString()
  fullyGatedFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for gate (required if fullyGatedFile is base64)' })
  @IsOptional()
  @IsString()
  fullyGatedFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for gate (required if fullyGatedFile is base64)' })
  @IsOptional()
  @IsString()
  fullyGatedFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether security guards are deployed 24/7', example: true })
  @IsBoolean()
  @IsNotEmpty()
  securityGuards24x7!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for security guard deployment proof (required if securityGuards24x7 is true)' })
  @ValidateIf((o) => o.securityGuards24x7 === true)
  @IsNotEmpty({ message: 'securityGuards24x7File is required when securityGuards24x7 is true' })
  @IsString()
  securityGuards24x7File?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for security guards (required if securityGuards24x7File is base64)' })
  @IsOptional()
  @IsString()
  securityGuards24x7FileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for security guards (required if securityGuards24x7File is base64)' })
  @IsOptional()
  @IsString()
  securityGuards24x7FileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether CCTV cameras are installed and functional', example: true })
  @IsBoolean()
  @IsNotEmpty()
  cctvCameras!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for CCTV proof (required if cctvCameras is true)' })
  @ValidateIf((o) => o.cctvCameras === true)
  @IsNotEmpty({ message: 'cctvCamerasFile is required when cctvCameras is true' })
  @IsString()
  cctvCamerasFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for CCTV (required if cctvCamerasFile is base64)' })
  @IsOptional()
  @IsString()
  cctvCamerasFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for CCTV (required if cctvCamerasFile is base64)' })
  @IsOptional()
  @IsString()
  cctvCamerasFileMimeType?: string;
}

export class InfrastructureUtilitiesDto {
  @ApiProperty({ type: Boolean, description: 'Whether functional weighbridge is available', example: true })
  @IsBoolean()
  @IsNotEmpty()
  functionalWeighbridge!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for weighbridge certificate (required if functionalWeighbridge is true)' })
  @ValidateIf((o) => o.functionalWeighbridge === true)
  @IsNotEmpty({ message: 'functionalWeighbridgeFile is required when functionalWeighbridge is true' })
  @IsString()
  functionalWeighbridgeFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for weighbridge (required if functionalWeighbridgeFile is base64)' })
  @IsOptional()
  @IsString()
  functionalWeighbridgeFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for weighbridge (required if functionalWeighbridgeFile is base64)' })
  @IsOptional()
  @IsString()
  functionalWeighbridgeFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether sampling and testing area exists', example: true })
  @IsBoolean()
  @IsNotEmpty()
  samplingTestingArea!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for sampling area proof (required if samplingTestingArea is true)' })
  @ValidateIf((o) => o.samplingTestingArea === true)
  @IsNotEmpty({ message: 'samplingTestingAreaFile is required when samplingTestingArea is true' })
  @IsString()
  samplingTestingAreaFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for sampling area (required if samplingTestingAreaFile is base64)' })
  @IsOptional()
  @IsString()
  samplingTestingAreaFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for sampling area (required if samplingTestingAreaFile is base64)' })
  @IsOptional()
  @IsString()
  samplingTestingAreaFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether laboratory instruments are functional and calibrated', example: true })
  @IsBoolean()
  @IsNotEmpty()
  calibratedInstruments!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for calibration certificates (required if calibratedInstruments is true)' })
  @ValidateIf((o) => o.calibratedInstruments === true)
  @IsNotEmpty({ message: 'calibratedInstrumentsFile is required when calibratedInstruments is true' })
  @IsString()
  calibratedInstrumentsFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for calibration certificates (required if calibratedInstrumentsFile is base64)' })
  @IsOptional()
  @IsString()
  calibratedInstrumentsFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for calibration certificates (required if calibratedInstrumentsFile is base64)' })
  @IsOptional()
  @IsString()
  calibratedInstrumentsFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether functional office area and security room are available', example: true })
  @IsBoolean()
  @IsNotEmpty()
  functionalOffice!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for office area proof (required if functionalOffice is true)' })
  @ValidateIf((o) => o.functionalOffice === true)
  @IsNotEmpty({ message: 'functionalOfficeFile is required when functionalOffice is true' })
  @IsString()
  functionalOfficeFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for office area (required if functionalOfficeFile is base64)' })
  @IsOptional()
  @IsString()
  functionalOfficeFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for office area (required if functionalOfficeFile is base64)' })
  @IsOptional()
  @IsString()
  functionalOfficeFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether toilets/washrooms are operational', example: true })
  @IsBoolean()
  @IsNotEmpty()
  operationalToilets!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for toilets proof (required if operationalToilets is true)' })
  @ValidateIf((o) => o.operationalToilets === true)
  @IsNotEmpty({ message: 'operationalToiletsFile is required when operationalToilets is true' })
  @IsString()
  operationalToiletsFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for toilets (required if operationalToiletsFile is base64)' })
  @IsOptional()
  @IsString()
  operationalToiletsFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for toilets (required if operationalToiletsFile is base64)' })
  @IsOptional()
  @IsString()
  operationalToiletsFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether electricity and gas utilities are available', example: true })
  @IsBoolean()
  @IsNotEmpty()
  electricityGasUtilities!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for utility bills (required if electricityGasUtilities is true)' })
  @ValidateIf((o) => o.electricityGasUtilities === true)
  @IsNotEmpty({ message: 'electricityGasUtilitiesFile is required when electricityGasUtilities is true' })
  @IsString()
  electricityGasUtilitiesFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for utility bills (required if electricityGasUtilitiesFile is base64)' })
  @IsOptional()
  @IsString()
  electricityGasUtilitiesFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for utility bills (required if electricityGasUtilitiesFile is base64)' })
  @IsOptional()
  @IsString()
  electricityGasUtilitiesFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether backup generator is installed and operational', example: true })
  @IsBoolean()
  @IsNotEmpty()
  backupGenerator!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for generator proof (required if backupGenerator is true)' })
  @ValidateIf((o) => o.backupGenerator === true)
  @IsNotEmpty({ message: 'backupGeneratorFile is required when backupGenerator is true' })
  @IsString()
  backupGeneratorFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for generator (required if backupGeneratorFile is base64)' })
  @IsOptional()
  @IsString()
  backupGeneratorFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for generator (required if backupGeneratorFile is base64)' })
  @IsOptional()
  @IsString()
  backupGeneratorFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether adequate residential arrangements are available', example: true })
  @IsBoolean()
  @IsNotEmpty()
  adequateResidentialArrangements!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for residential arrangements proof (required if adequateResidentialArrangements is true)' })
  @ValidateIf((o) => o.adequateResidentialArrangements === true)
  @IsNotEmpty({ message: 'adequateResidentialArrangementsFile is required when adequateResidentialArrangements is true' })
  @IsString()
  adequateResidentialArrangementsFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for residential arrangements (required if adequateResidentialArrangementsFile is base64)' })
  @IsOptional()
  @IsString()
  adequateResidentialArrangementsFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for residential arrangements (required if adequateResidentialArrangementsFile is base64)' })
  @IsOptional()
  @IsString()
  adequateResidentialArrangementsFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether axial/aeration fans are installed (only for grain silos)', example: false })
  @IsBoolean()
  @IsNotEmpty()
  axialAerationFans!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for axial fans proof (required if axialAerationFans is true)' })
  @ValidateIf((o) => o.axialAerationFans === true)
  @IsNotEmpty({ message: 'axialAerationFansFile is required when axialAerationFans is true' })
  @IsString()
  axialAerationFansFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for axial fans (required if axialAerationFansFile is base64)' })
  @IsOptional()
  @IsString()
  axialAerationFansFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for axial fans (required if axialAerationFansFile is base64)' })
  @IsOptional()
  @IsString()
  axialAerationFansFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether vents and exhaust fans on top of silos are installed (only for grain silos)', example: false })
  @IsBoolean()
  @IsNotEmpty()
  ventsExhaustFans!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for vents/exhaust fans proof (required if ventsExhaustFans is true)' })
  @ValidateIf((o) => o.ventsExhaustFans === true)
  @IsNotEmpty({ message: 'ventsExhaustFansFile is required when ventsExhaustFans is true' })
  @IsString()
  ventsExhaustFansFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for vents/exhaust fans (required if ventsExhaustFansFile is base64)' })
  @IsOptional()
  @IsString()
  ventsExhaustFansFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for vents/exhaust fans (required if ventsExhaustFansFile is base64)' })
  @IsOptional()
  @IsString()
  ventsExhaustFansFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether technical drawing with measurements is available (only for grain silos)', example: false })
  @IsBoolean()
  @IsNotEmpty()
  technicalDrawing!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for technical drawing (required if technicalDrawing is true)' })
  @ValidateIf((o) => o.technicalDrawing === true)
  @IsNotEmpty({ message: 'technicalDrawingFile is required when technicalDrawing is true' })
  @IsString()
  technicalDrawingFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for technical drawing (required if technicalDrawingFile is base64)' })
  @IsOptional()
  @IsString()
  technicalDrawingFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for technical drawing (required if technicalDrawingFile is base64)' })
  @IsOptional()
  @IsString()
  technicalDrawingFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether drying facility is installed and available (only for grain silos)', example: false })
  @IsBoolean()
  @IsNotEmpty()
  dryingFacility!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for drying facility proof (required if dryingFacility is true)' })
  @ValidateIf((o) => o.dryingFacility === true)
  @IsNotEmpty({ message: 'dryingFacilityFile is required when dryingFacility is true' })
  @IsString()
  dryingFacilityFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for drying facility (required if dryingFacilityFile is base64)' })
  @IsOptional()
  @IsString()
  dryingFacilityFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for drying facility (required if dryingFacilityFile is base64)' })
  @IsOptional()
  @IsString()
  dryingFacilityFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether temperature sensor cables are installed and 70% are working (only for grain silos)', example: false })
  @IsBoolean()
  @IsNotEmpty()
  temperatureSensorCables!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for temperature sensor proof (required if temperatureSensorCables is true)' })
  @ValidateIf((o) => o.temperatureSensorCables === true)
  @IsNotEmpty({ message: 'temperatureSensorCablesFile is required when temperatureSensorCables is true' })
  @IsString()
  temperatureSensorCablesFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for temperature sensor (required if temperatureSensorCablesFile is base64)' })
  @IsOptional()
  @IsString()
  temperatureSensorCablesFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for temperature sensor (required if temperatureSensorCablesFile is base64)' })
  @IsOptional()
  @IsString()
  temperatureSensorCablesFileMimeType?: string;
}

export class StorageFacilitiesDto {
  @ApiProperty({ type: Boolean, description: 'Whether storage area doors are secured', example: true })
  @IsBoolean()
  @IsNotEmpty()
  securedDoors!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for secured doors proof (required if securedDoors is true)' })
  @ValidateIf((o) => o.securedDoors === true)
  @IsNotEmpty({ message: 'securedDoorsFile is required when securedDoors is true' })
  @IsString()
  securedDoorsFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for secured doors (required if securedDoorsFile is base64)' })
  @IsOptional()
  @IsString()
  securedDoorsFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for secured doors (required if securedDoorsFile is base64)' })
  @IsOptional()
  @IsString()
  securedDoorsFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether flooring is plastered, non-slippery, smooth, and free of potholes', example: true })
  @IsBoolean()
  @IsNotEmpty()
  plasteredFlooring!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for flooring proof (required if plasteredFlooring is true)' })
  @ValidateIf((o) => o.plasteredFlooring === true)
  @IsNotEmpty({ message: 'plasteredFlooringFile is required when plasteredFlooring is true' })
  @IsString()
  plasteredFlooringFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for flooring (required if plasteredFlooringFile is base64)' })
  @IsOptional()
  @IsString()
  plasteredFlooringFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for flooring (required if plasteredFlooringFile is base64)' })
  @IsOptional()
  @IsString()
  plasteredFlooringFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether walls are plastered and painted', example: true })
  @IsBoolean()
  @IsNotEmpty()
  plasteredWalls!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for walls proof (required if plasteredWalls is true)' })
  @ValidateIf((o) => o.plasteredWalls === true)
  @IsNotEmpty({ message: 'plasteredWallsFile is required when plasteredWalls is true' })
  @IsString()
  plasteredWallsFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for walls (required if plasteredWallsFile is base64)' })
  @IsOptional()
  @IsString()
  plasteredWallsFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for walls (required if plasteredWallsFile is base64)' })
  @IsOptional()
  @IsString()
  plasteredWallsFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether ceiling is intact and free of leakage', example: true })
  @IsBoolean()
  @IsNotEmpty()
  intactCeiling!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for ceiling proof (required if intactCeiling is true)' })
  @ValidateIf((o) => o.intactCeiling === true)
  @IsNotEmpty({ message: 'intactCeilingFile is required when intactCeiling is true' })
  @IsString()
  intactCeilingFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for ceiling (required if intactCeilingFile is base64)' })
  @IsOptional()
  @IsString()
  intactCeilingFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for ceiling (required if intactCeilingFile is base64)' })
  @IsOptional()
  @IsString()
  intactCeilingFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether windows and ventilators are installed and functional', example: true })
  @IsBoolean()
  @IsNotEmpty()
  functionalWindows!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for windows proof (required if functionalWindows is true)' })
  @ValidateIf((o) => o.functionalWindows === true)
  @IsNotEmpty({ message: 'functionalWindowsFile is required when functionalWindows is true' })
  @IsString()
  functionalWindowsFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for windows (required if functionalWindowsFile is base64)' })
  @IsOptional()
  @IsString()
  functionalWindowsFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for windows (required if functionalWindowsFile is base64)' })
  @IsOptional()
  @IsString()
  functionalWindowsFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether protective netting is installed on windows and ventilators', example: true })
  @IsBoolean()
  @IsNotEmpty()
  protectiveNetting!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for protective netting proof (required if protectiveNetting is true)' })
  @ValidateIf((o) => o.protectiveNetting === true)
  @IsNotEmpty({ message: 'protectiveNettingFile is required when protectiveNetting is true' })
  @IsString()
  protectiveNettingFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for protective netting (required if protectiveNettingFile is base64)' })
  @IsOptional()
  @IsString()
  protectiveNettingFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for protective netting (required if protectiveNettingFile is base64)' })
  @IsOptional()
  @IsString()
  protectiveNettingFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether exhaust fans are installed and functional', example: true })
  @IsBoolean()
  @IsNotEmpty()
  functionalExhaustFans!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for exhaust fans proof (required if functionalExhaustFans is true)' })
  @ValidateIf((o) => o.functionalExhaustFans === true)
  @IsNotEmpty({ message: 'functionalExhaustFansFile is required when functionalExhaustFans is true' })
  @IsString()
  functionalExhaustFansFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for exhaust fans (required if functionalExhaustFansFile is base64)' })
  @IsOptional()
  @IsString()
  functionalExhaustFansFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for exhaust fans (required if functionalExhaustFansFile is base64)' })
  @IsOptional()
  @IsString()
  functionalExhaustFansFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether warehouse is free from termites, pests, and infestations', example: true })
  @IsBoolean()
  @IsNotEmpty()
  freeFromPests!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for pest control certificate (required if freeFromPests is true)' })
  @ValidateIf((o) => o.freeFromPests === true)
  @IsNotEmpty({ message: 'freeFromPestsFile is required when freeFromPests is true' })
  @IsString()
  freeFromPestsFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for pest control (required if freeFromPestsFile is base64)' })
  @IsOptional()
  @IsString()
  freeFromPestsFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for pest control (required if freeFromPestsFile is base64)' })
  @IsOptional()
  @IsString()
  freeFromPestsFileMimeType?: string;

  @ApiProperty({ type: Boolean, description: 'Whether fire safety measures are in place and functional', example: true })
  @IsBoolean()
  @IsNotEmpty()
  fireSafetyMeasures!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Document ID (UUID) or base64-encoded string for fire safety proof (required if fireSafetyMeasures is true)' })
  @ValidateIf((o) => o.fireSafetyMeasures === true)
  @IsNotEmpty({ message: 'fireSafetyMeasuresFile is required when fireSafetyMeasures is true' })
  @IsString()
  fireSafetyMeasuresFile?: string;

  @ApiPropertyOptional({ type: String, description: 'Original filename for fire safety (required if fireSafetyMeasuresFile is base64)' })
  @IsOptional()
  @IsString()
  fireSafetyMeasuresFileName?: string;

  @ApiPropertyOptional({ type: String, description: 'MIME type for fire safety (required if fireSafetyMeasuresFile is base64)' })
  @IsOptional()
  @IsString()
  fireSafetyMeasuresFileMimeType?: string;
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


