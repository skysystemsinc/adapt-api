import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateFireSafetyDto {
  @IsString()
  @IsNotEmpty()
  fireExtinguishers: string;

  @IsString()
  @IsNotEmpty()
  fireBuckets: string;

  @IsBoolean()
  waterArrangements: boolean;

  @IsBoolean()
  fireSafetyAlarms: boolean;

  @IsOptional()
  @IsString()
  otherFireSafetyMeasures?: string;
}
