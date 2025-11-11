import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEmail, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
export { CreateBankDetailsDto } from "./create-bank-details.dto";
export { CreateCompanyInformationRequestDto, CompanyInformationResponseDto } from "./create-company-information.dto";

export class AuthorizedSignatoryDto {
    @ApiProperty({
        type: String,
        description: 'The authorized signatory name',
        example: 'John Doe authorized signatory',
    })
    @IsString()
    @IsNotEmpty()
    authorizedSignatoryName!: string;

    @ApiProperty({
        type: String,
        description: 'The name of the authorized signatory',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({
        type: Number,
        description: 'The CNIC of the authorized signatory',
        example: 1234567890,
    })
    @IsNumber()
    @IsNotEmpty()
    cnic!: number;

    @ApiProperty({
        type: String,
        description: 'The passport of the authorized signatory',
        example: '1234567890',
    })
    @IsString()
    @IsOptional()
    passport?: string;

    @ApiProperty({
        type: Date,
        description: 'The issuance date of the CNIC',
        example: '2021-01-01',
    })
    @IsISO8601()
    @IsNotEmpty()
    issuanceDateOfCnic!: Date;

    @ApiProperty({
        type: Date,
        description: 'The expiry date of the CNIC',
        example: '2021-01-01',
    })
    @IsISO8601()
    @IsNotEmpty()
    expiryDateOfCnic!: Date;

    @ApiProperty({
        type: String,
        description: 'The city of the authorized signatory',
        example: 'Karachi',
    })
    @IsString()
    @IsNotEmpty()
    city!: string;

    @ApiProperty({
        type: String,
        description: 'The country of the authorized signatory',
        example: 'Pakistan',
    })
    @IsString()
    @IsNotEmpty()
    country!: string;

    @ApiProperty({
        type: String,
        description: 'The postal code of the authorized signatory',
        example: '1234567890',
    })
    @IsString()
    @IsNotEmpty()
    postalCode!: string;

    @ApiProperty({
        type: String,
        description: 'The designation of the authorized signatory',
        example: 'Manager',
    })
    @IsString()
    @IsNotEmpty()
    designation!: string;

    @ApiProperty({
        type: String,
        description: 'The mobile number of the authorized signatory',
        example: '1234567890',
    })
    @IsString()
    @IsNotEmpty()
    mobileNumber!: string;

    @ApiProperty({
        type: String,
        description: 'The email of the authorized signatory',
        example: 'john.doe@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({
        type: String,
        description: 'The mailing address of the authorized signatory',
        example: '1234567890',
    })
    @IsString()
    @IsNotEmpty()
    mailingAddress!: string;

    @ApiPropertyOptional({
        type: String,
        description: 'The landline number of the authorized signatory',
        example: '021-1234567890',
    })
    @IsString()
    @IsOptional()
    landlineNumber!: string;
}
export class CreateWarehouseOperatorApplicationRequestDto {
    @ApiProperty({
        type: String,
        description: 'Authorized signatory Array of Objects',
        example: [{ authorizedSignatoryName: "John Doe authorized signatory", name: "John Doe", cnic: 1234567890, passport: "1234567890", issuanceDateOfCnic: "2021-01-01", expiryDateOfCnic: "2021-01-01", mailingAddress: "1234567890", city: "Karachi", country: "Pakistan", postalCode: "1234567890", designation: "Manager", mobileNumber: "1234567890", email: "john.doe@example.com", landlineNumber: "1234567890" }],
    })
    @IsArray()
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => AuthorizedSignatoryDto)
    @IsNotEmpty()
    authorizedSignatories!: AuthorizedSignatoryDto[];
}