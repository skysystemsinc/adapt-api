import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  facilityContactPerson: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsString()
  @IsNotEmpty()
  mobileNumber: string;
}
