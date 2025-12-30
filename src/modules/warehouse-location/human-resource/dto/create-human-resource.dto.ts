import { IsString, IsNotEmpty, IsOptional, IsEmail, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseFileUploadDto } from 'src/common/dto/base-file-upload.dto';

export class CreateHumanResourceDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    fullName: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    fathersHusbandsName: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    cnicPassport: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nationality: string;

    @IsDateString()
    @IsOptional()
    dateOfBirth?: Date | null;

    @IsString()
    @IsNotEmpty()
    residentialAddress: string;

    @IsString()
    @IsOptional()
    businessAddress?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    telephoneNumber?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    mobileNumber: string;

    @IsEmail()
    @IsNotEmpty()
    @MaxLength(200)
    email: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    hrNationalTaxNumber?: string;

    @ApiProperty({
        type: BaseFileUploadDto,
        description: 'Photograph file (base64 encoded). Max size: 10MB',
        required: false,
    })
    @IsOptional()
    photograph?: BaseFileUploadDto;

    @IsOptional()
    @Exclude()
    hrId?: string; // Excluded from validation - comes from URL parameter
}