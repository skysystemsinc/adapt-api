import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEmail, IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateIf, ValidateNested } from "class-validator";
import { AuthorizedSignatory } from "../entities/authorized-signatories.entity";
import { Type } from "class-transformer";


export enum AccountType {
    CURRENT = 'CURRENT',
    SAVINGS = 'SAVINGS',
    FIXED_DEPOSIT = 'FIXED_DEPOSIT',
    TERM_DEPOSIT = 'TERM_DEPOSIT',
    OTHER = 'OTHER',
}

export class CreateBankDetailsDto {

    @ApiPropertyOptional({
        type: String,
        description: 'Bank Name',
        example: 'Bank of America',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3, { message: 'Bank name must be at least 3 characters long' })
    @MaxLength(30, { message: 'Bank name must be less than 30 characters long' })
    name!: string;

    @ApiProperty({
        type: String,
        description: 'The account title',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3, { message: 'Account title must be at least 3 characters long' })
    @MaxLength(30, { message: 'Account title must be less than 30 characters long' })
    accountTitle!: string;

    @ApiProperty({
        type: String,
        description: 'The IBAN',
        example: 'PK12345678901234567890',
    })
    @IsString()
    @IsNotEmpty()
    iban!: string;

    @ApiPropertyOptional({
        type: String,
        description: 'The account type',
        example: AccountType.CURRENT,
    })
    // custom message on enum validation error
    @ValidateIf((object: CreateBankDetailsDto, value: AccountType) => value !== undefined)
    @IsEnum(AccountType, { message: 'Invalid account type' })
    @IsOptional()
    accountType?: AccountType;

    @ApiPropertyOptional({
        type: String,
        description: 'The branch address',
        example: 'Branch Address',
    })
    @IsString()
    @IsOptional()
    branchAddress?: string;
}

export class UpdateBankDetailsDto extends CreateBankDetailsDto{}