import { IsString, IsNotEmpty, IsArray, IsOptional, IsDateString } from 'class-validator';

export class CreateFacilityDto {
  @IsString()
  @IsNotEmpty()
  facilityName: string;

  @IsString()
  @IsNotEmpty()
  storageFacilityType: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  numberOfStorageUnits: string;

  @IsString()
  @IsNotEmpty()
  individualCapacityPerUnit: string;

  @IsString()
  @IsNotEmpty()
  totalCapacity: string;

  @IsString()
  @IsNotEmpty()
  storageFacilitiesAppliedFor: string;

  @IsArray()
  @IsString({ each: true })
  produceForAccreditation: string[];

  @IsString()
  @IsNotEmpty()
  totalCapacityAppliedFor: string;

  @IsString()
  @IsNotEmpty()
  plinthHeight: string;

  @IsString()
  @IsNotEmpty()
  length: string;

  @IsString()
  @IsNotEmpty()
  width: string;

  @IsString()
  @IsNotEmpty()
  height: string;

  @IsString()
  @IsNotEmpty()
  ownership: string;

  @IsOptional()
  @IsDateString()
  leaseDuration?: Date | null;

  @IsOptional()
  @IsString()
  borrowerCodeOfPropertyOwner?: string | null;
}
