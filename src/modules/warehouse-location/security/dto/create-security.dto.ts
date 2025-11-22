import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSecurityDto {
  @IsString()
  @IsNotEmpty()
  guardsDeployed: string;

  @IsString()
  @IsNotEmpty()
  NumberOfCameras: string;

  @IsString()
  @IsNotEmpty()
  otherSecurityMeasures: string;
}
