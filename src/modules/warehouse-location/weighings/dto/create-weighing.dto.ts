import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseFileUploadDto } from 'src/common/dto/base-file-upload.dto';

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
    type: BaseFileUploadDto,
    description: 'Weighbridge calibration certificate file (base64 encoded). Max size: 10MB',
    required: false,
  })
  @IsOptional()
  weighbridgeCalibrationCertificate?: BaseFileUploadDto;
}
