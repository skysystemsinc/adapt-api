import { IsOptional, IsEnum, IsInt, Min, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListWarehouseOperatorApplicationDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'The search query',
    required: false,
    example: 'Warehouse Operator Application Name',
  })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({
    description: 'The page number',
    required: false,
    example: 1,
  })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
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

