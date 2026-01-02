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
    description: 'Weighbridge calibration certificate as base64-encoded string or existing document ID (required for create, optional for update)',
    example: 'data:application/pdf;base64,JVBERi0xLjQK...',
    required: false,
  })
  @IsOptional()
  @IsString()
  weighbridgeCalibrationCertificate?: string;

  @ApiProperty({
    description: 'Original filename for calibration certificate (required if weighbridgeCalibrationCertificate is base64)',
    required: false,
  })
  @IsOptional()
  @IsString()
  weighbridgeCalibrationCertificateFileName?: string;

  @ApiProperty({
    description: 'MIME type for calibration certificate (required if weighbridgeCalibrationCertificate is base64)',
    required: false,
  })
  @IsOptional()
  @IsString()
  weighbridgeCalibrationCertificateMimeType?: string;
}
