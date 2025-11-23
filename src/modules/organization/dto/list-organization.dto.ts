import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Organization, OrganizationStatus, OrganizationType } from "../entities/organization.entity";
import { Type } from "class-transformer";

export class OrganizationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: OrganizationStatus })
  status: OrganizationStatus;

  @ApiProperty({ enum: OrganizationType })
  type: OrganizationType;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ description: 'Created by user ID', nullable: true })
  createdBy?: string;
}

export class ListOrganizationDto {
  @IsOptional()
  @IsEnum(OrganizationStatus)
  @ApiPropertyOptional({
    description: 'The status of the organization',
    required: false,
    enum: OrganizationStatus,
    example: OrganizationStatus.ACTIVE,
  })
  status?: OrganizationStatus | undefined;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'The search query',
    required: false,
    example: 'John Doe',
  })
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'The page number',
    required: false,
    example: 1,
  })
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'The number of items per page',
    required: false,
    example: 10,
  })
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'The field to sort by',
    required: false,
    example: 'createdAt',
  })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  @ApiPropertyOptional({
    description: 'The order to sort by',
    required: false,
    example: 'DESC',
  })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class ListOrganizationResponseDto {
  @ApiProperty({ 
    description: 'The list of organizations', 
    type: OrganizationDto,
    isArray: true 
  })
  organizations: OrganizationDto[];

  @ApiProperty({ description: 'The total number of organizations' })
  total: number;

  @ApiProperty({ description: 'The page number' })
  page: number;

  @ApiProperty({ description: 'The number of items per page' })
  limit: number;
}
