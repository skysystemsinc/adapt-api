import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { AssignmentLevel } from "../entities/assignment.entity";
import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ApproveUnlockRequestDto {
    @ApiProperty({
        description: 'The level of the unlock request',
        example: AssignmentLevel.ADMIN_TO_APPLICANT,
    })
    @IsEnum(AssignmentLevel)
    @IsNotEmpty()
    level: AssignmentLevel;

    @ApiProperty({
        description: 'The sections of the unlock request',
        example: [
            {
                sectionType: 'bank_details',
                fields: [
                    {
                        fieldName: 'iban',
                        remarks: 'The IBAN of the company',
                    },
                    {
                        fieldName: 'swift_code',
                        remarks: 'The SWIFT code of the company',
                    },
                ],
            },
        ],
    })
    @IsArray()
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => UnlockRequestSectionDto)
    sections: UnlockRequestSectionDto[];

    @ApiPropertyOptional({
        description: 'The remarks of the unlock request',
        example: 'The remarks of the unlock request',
    })
    @IsString()
    @IsOptional()
    remarks?: string;
}


export class UnlockRequestSectionDto {
    @ApiProperty({
        description: 'The type of the section',
        example: 'bank_details',
    })
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }: { value: string }) => value.toLowerCase())
    @Transform(({ value }: { value: string }) => value.replace(/ /g, '-'))
    @Transform(({ value }: { value: string }) => value.replace(/[^a-z0-9-]/g, ''))
    @Transform(({ value }: { value: string }) => value.replace(/^-+|-+$/g, ''))
    @Transform(({ value }: { value: string }) => value.replace(/-+/g, '-'))
    @Transform(({ value }: { value: string }) => value.replace(/^-+|-+$/g, ''))
    sectionType: string;

    @ApiPropertyOptional({
        description: 'The original section identifier from the source application (e.g. KYC section ID)',
        example: '1',
    })
    @IsString()
    @IsOptional()
    sectionId?: string;

    @ApiProperty({
        description: 'The ID of the resource',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsNotEmpty()
    resourceId: string;

    @ApiProperty({
        description: 'The type of the resource',
        example: 'warehouse',
    })
    @IsString()
    @IsOptional()
    resourceType?: string;

    @ApiProperty({
        description: 'The fields of the section',
        example: [
            {
                fieldName: 'iban',
                remarks: 'The IBAN of the company',
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UnlockRequestFieldDto)
    fields: UnlockRequestFieldDto[];
}


export class UnlockRequestFieldDto {
    @ApiProperty({
        description: 'The name of the field',
        example: 'iban',
    })
    @IsString()
    @IsNotEmpty()
    fieldName: string;

    @ApiPropertyOptional({
        description: 'The remarks of the field',
        example: 'The IBAN of the company',
    })
    @IsString()
    @IsOptional()
    remarks?: string;

    @ApiPropertyOptional({
        description: 'The original field identifier from the source application (e.g. KYC field ID)',
        example: 'bank-details-iban',
    })
    @IsString()
    @IsOptional()
    fieldId?: string;
}
