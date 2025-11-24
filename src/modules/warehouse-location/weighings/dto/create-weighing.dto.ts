import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';

const transformToBoolean = (value: any): boolean => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
} 
export class CreateWeighingDto {
  @Transform(({ value }) => transformToBoolean(value))
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

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Weighbridge calibration certificate file (PDF, PNG, JPG, JPEG, DOC, DOCX). Max size: 10MB',
    required: true,
  })
  @Transform(({ value }) => {
    // Transform empty strings to undefined to avoid validation errors
    // The actual file is handled by FileInterceptor, not the DTO
    if (value === '' || value === null) return undefined;
    return value;
  })
  @IsOptional()
  @Exclude()
  weighbridgeCalibrationCertificate?: any;

  // Step 6: WeighingMore fields
  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  laboratoryFacility: boolean;

  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  minimumLabEquipmentExist: boolean;

  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  equipmentCalibrated: boolean;

  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  washroomsExist: boolean;

  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  waterAvailability: boolean;

  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  officeInternetFacility: boolean;

  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  electricityAvailable: boolean;

  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  gasAvailable: boolean;

  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  generatorAvailable: boolean;

  @IsOptional()
  @IsString()
  otherUtilitiesFacilities?: string;
}
