import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateWeighingDto {
  @IsBoolean()
  weighbridgeAvailable: boolean;

  @IsString()
  @IsNotEmpty()
  weighbridgeLocation: string;

  @IsString()
  @IsNotEmpty()
  weighbridgeCapacity: string;

  @IsOptional()
  @IsString()
  weighbridgeMakeModel?: string;

  @IsOptional()
  @IsDateString()
  weighbridgeInstallationDate?: Date | null;

  @IsDateString()
  @IsNotEmpty()
  weighbridgeCalibrationStatus: Date | null;

  @IsDateString()
  @IsNotEmpty()
  weighbridgeNextCalibrationDueDate: Date | null;

  @IsOptional()
  @IsString()
  weighbridgeOwnerOperatorName?: string;

  @IsOptional()
  @IsString()
  weighbridgeAddressLocation?: string;

  @IsOptional()
  @IsString()
  weighbridgeDistanceFromFacility?: string;

  // Note: File uploads will be handled separately
  // weighbridgeCalibrationCertificate will be handled via file upload endpoint

  // Step 6: WeighingMore fields
  @IsBoolean()
  laboratoryFacility: boolean;

  @IsBoolean()
  minimumLabEquipmentExist: boolean;

  @IsBoolean()
  equipmentCalibrated: boolean;

  @IsBoolean()
  washroomsExist: boolean;

  @IsBoolean()
  waterAvailability: boolean;

  @IsBoolean()
  officeInternetFacility: boolean;

  @IsBoolean()
  electricityAvailable: boolean;

  @IsBoolean()
  gasAvailable: boolean;

  @IsBoolean()
  generatorAvailable: boolean;

  @IsOptional()
  @IsString()
  otherUtilitiesFacilities?: string;
}
