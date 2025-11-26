import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsString, Min, IsOptional, IsBoolean, IsUUID } from "class-validator";

export class CreateAssessmentSubSectionDto {
    @ApiProperty({ description: 'ID of the parent expert assessment', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    assessmentId: string;

    @ApiProperty({ example: 'Transformer Capacity' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ default: 0, description: 'Display order' })
    @IsOptional()
    @IsInt()
    @Min(0)
    order?: number;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
