import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEmail, IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { AuthorizedSignatory } from "../entities/authorized-signatories.entity";
import { Type } from "class-transformer";


enum AccountType {
    CURRENT = 'CURRENT',
    SAVINGS = 'SAVINGS',
    FIXED_DEPOSIT = 'FIXED_DEPOSIT',
    TERM_DEPOSIT = 'TERM_DEPOSIT',
    OTHER = 'OTHER',
}

export class CreateBankDetailsDto {
    @ApiProperty({
        type: String,
        description: 'The account title',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
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
    @IsEnum(AccountType)
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
