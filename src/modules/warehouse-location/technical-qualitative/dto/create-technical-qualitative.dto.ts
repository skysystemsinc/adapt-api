import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const transformToBoolean = (value: any): boolean => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
}

export class CreateTechnicalQualitativeDto {
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

  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  gasAvailable: boolean;

  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  generatorAvailable: boolean;

  @IsOptional()
  @IsString()
  otherUtilitiesFacilities?: string;
}

