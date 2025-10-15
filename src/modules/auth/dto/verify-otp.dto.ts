import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyOTPDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
