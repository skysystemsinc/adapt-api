import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseFileUploadDto } from 'src/common/dto/base-file-upload.dto';

const transformToBoolean = (value: any): boolean => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
}

export class CreateProfessionalQualificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  certificationTitle: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  issuingBody: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @IsDateString()
  @IsOptional()
  dateOfAward?: Date | null;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  membershipNumber?: string;

  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  @IsOptional()
  hasExpiryDate?: boolean;

  @ApiProperty({
    type: BaseFileUploadDto,
    description: 'Professional certificate file (base64 encoded). Max size: 10MB',
    required: false,
  })
  @IsOptional()
  professionalCertificate?: BaseFileUploadDto;
}
