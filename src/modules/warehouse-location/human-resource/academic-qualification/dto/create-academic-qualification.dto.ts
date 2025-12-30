import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseFileUploadDto } from 'src/common/dto/base-file-upload.dto';

export class CreateAcademicQualificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  degree: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  major: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  institute: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  yearOfPassing: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  grade?: string;

  @ApiProperty({
    type: BaseFileUploadDto,
    description: 'Academic certificate file (base64 encoded). Max size: 10MB',
    required: false,
  })
  @IsOptional()
  academicCertificate?: BaseFileUploadDto;
}
