import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RejectApplicationDto {
    @ApiProperty({
        description: 'The sections of the assignment',
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
    @Type(() => AssignmentSectionDto)
    sections: AssignmentSectionDto[];

    @ApiPropertyOptional({
        description: 'The remarks of the assignment',
        example: 'The remarks of the assignment',
    })
    @IsString()
    @IsOptional()
    remarks?: string;

    @ApiPropertyOptional({
        description: 'The type of the application',
        example: 'hr',
    })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({
        description: 'The ID of the previous assignment',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsUUID()
    previousAssignmentId?: string | null;
}


export class AssignmentSectionDto {
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
    @Type(() => AssignmentFieldDto)
    fields: AssignmentFieldDto[];
}


export class AssignmentFieldDto {
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
