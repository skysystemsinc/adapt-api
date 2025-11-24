import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const transformToBoolean = (value: any): boolean => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
}

export class CreateDeclarationDto {
  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  @IsNotEmpty()
  writeOffAvailed: boolean;

  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  @IsNotEmpty()
  defaultOfFinance: boolean;

  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  @IsNotEmpty()
  placementOnECL: boolean;

  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  @IsNotEmpty()
  convictionOrPleaBargain: boolean;
}

