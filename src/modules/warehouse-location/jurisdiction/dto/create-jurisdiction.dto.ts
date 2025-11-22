import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateJurisdictionDto {
  @IsString()
  @IsNotEmpty()
  jurisdictionalPoliceStationName: string;

  @IsString()
  @IsNotEmpty()
  policeStationDistance: string;

  @IsString()
  @IsNotEmpty()
  nearestFireStationName: string;

  @IsString()
  @IsNotEmpty()
  fireStationDistance: string;

  @IsString()
  @IsNotEmpty()
  numberOfEntryAndExit: string;

  @IsBoolean()
  compoundWallFencing: boolean;

  @IsOptional()
  @IsString()
  heightOfCompoundWall?: string;

  @IsOptional()
  @IsBoolean()
  compoundWallBarbedFencing?: boolean;

  @IsBoolean()
  damageOnCompoundWall: boolean;
}
