import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';

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
    type: 'string',
    format: 'binary',
    description: 'Academic certificate file (PDF, PNG, JPG, JPEG, DOC, DOCX). Max size: 10MB',
    required: false,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null) return undefined;
    return value;
  })
  @IsOptional()
  @Exclude()
  academicCertificate?: any; // Made optional in DTO for FileInterceptor
}
