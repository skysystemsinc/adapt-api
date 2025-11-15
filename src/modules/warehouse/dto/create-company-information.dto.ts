import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsISO8601, IsNotEmpty,  IsOptional, IsString, MaxLength } from "class-validator";
import { Exclude, Transform } from "class-transformer";
export { CreateBankDetailsDto } from "./create-bank-details.dto";

export class CreateCompanyInformationRequestDto {
    @ApiProperty({
        type: String,
        description: 'The company name',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty({ message: 'Company name is required' })
    companyName!: string;

    @ApiProperty({
        type: String,
        description: 'The SECP registration number',
        example: '1234567890',
    })
    @IsString()
    @IsNotEmpty()
    secpRegistrationNumber!: string;

    @ApiProperty({
        type: Boolean,
        description: 'The active filer status',
        example: true,
    })
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return value;
    })
    @IsBoolean()
    @IsNotEmpty()
    activeFilerStatus!: boolean;

    @ApiProperty({
        type: String,
        description: 'The date of incorporation',
        example: '2021-01-01',
    })
    @IsISO8601()
    @IsNotEmpty()
    dateOfIncorporation!: Date;

    @ApiProperty({
        type: String,
        description: 'The business commencement date',
        example: '2021-01-01',
    })
    @IsISO8601()
    @IsOptional()
    businessCommencementDate?: Date;

    @ApiProperty({
        type: String,
        description: 'The registered office address',
        example: '1234567890',
    })
    @IsString()
    @IsNotEmpty()
    registeredOfficeAddress!: string;

    @ApiProperty({
        type: String,
        description: 'The postal code',
        example: '1234567890',
    })
    @IsString()
    @MaxLength(10)
    @IsOptional()
    postalCode?: string;

    @ApiProperty({
        type: String,
        description: 'The national tax number',
        example: '1234567890',
    })
    @IsString()
    @IsNotEmpty()
    nationalTaxNumber!: string;

    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'NTC certificate file (PDF, PNG, JPG, JPEG, DOC, DOCX). Max size: 100MB',
        required: false,
    })
    @Transform(({ value }) => {
        // Transform empty strings to undefined to avoid validation errors
        // The actual file is handled by FileInterceptor, not the DTO
        if (value === '' || value === null) return undefined;
        return value;
    })
    @IsOptional()
    @Exclude()
    ntcCertificate?: any;

    @ApiProperty({
        type: String,
        description: 'The sales tax registration number',
        example: '1234567890',
    })
    @IsString()
    @IsNotEmpty()
    salesTaxRegistrationNumber!: string;
}

/**
 * Response DTO for Company Information with document relations
 */
export class CompanyInformationResponseDto {
    @ApiProperty({ description: 'Company information ID' })
    id!: string;

    @ApiProperty({ description: 'Application ID' })
    applicationId!: string;

    @ApiProperty({ description: 'Company name' })
    companyName!: string;

    @ApiProperty({ description: 'SECP registration number' })
    secpRegistrationNumber!: string;

    @ApiProperty({ description: 'Active filer status' })
    activeFilerStatus!: boolean;

    @ApiProperty({ description: 'Date of incorporation' })
    dateOfIncorporation!: Date;

    @ApiPropertyOptional({ description: 'Business commencement date' })
    businessCommencementDate?: Date;

    @ApiProperty({ description: 'Registered office address' })
    registeredOfficeAddress!: string;

    @ApiPropertyOptional({ description: 'Postal code' })
    postalCode?: string;

    @ApiProperty({ description: 'National tax number' })
    nationalTaxNumber!: string;

    @ApiProperty({ description: 'Sales tax registration number' })
    salesTaxRegistrationNumber!: string;

    @ApiPropertyOptional({ 
        description: 'NTC certificate document ID from warehouse_documents table',
        example: 'd1ac02a6-a483-4a80-8a62-1f2de08dfaca',
    })
    ntcCertificate?: string;

    @ApiProperty({ description: 'Created at timestamp' })
    createdAt!: Date;

    @ApiProperty({ description: 'Updated at timestamp' })
    updatedAt!: Date;
}