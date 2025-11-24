import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsStrongPassword, IsUUID, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  }, {
    message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one symbol',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  lastName: string;

  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @IsUUID()
  @IsOptional()
  organizationId: string | null;
}
