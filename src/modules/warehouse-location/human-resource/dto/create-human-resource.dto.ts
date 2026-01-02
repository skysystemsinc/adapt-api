import { IsString, IsNotEmpty, IsOptional, IsEmail, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';

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

    @ApiPropertyOptional({
        type: String,
        description: 'Photograph as base64-encoded string or existing document ID (UUID)',
        example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
        required: false,
    })
    @IsOptional()
    @IsString()
    photograph?: string;

    @ApiPropertyOptional({
        type: String,
        description: 'Original filename for photograph (required if photograph is base64)',
        required: false,
    })
    @IsOptional()
    @IsString()
    photographFileName?: string;

    @ApiPropertyOptional({
        type: String,
        description: 'MIME type for photograph (required if photograph is base64)',
        required: false,
    })
    @IsOptional()
    @IsString()
    photographMimeType?: string;

    @IsOptional()
    @Exclude()
    hrId?: string; // Excluded from validation - comes from URL parameter
}