import { IsOptional, IsEnum, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WarehouseLocationStatus } from 'src/modules/warehouse-location/entities/warehouse-location.entity';

export class QueryLocationApplicationDto {
  @IsOptional()
  @IsEnum(WarehouseLocationStatus)
  @ApiPropertyOptional({
    description: 'The status of the warehouse location application',
    required: false,
    enum: WarehouseLocationStatus,
    example: WarehouseLocationStatus.PENDING,
  })
  status?: WarehouseLocationStatus | undefined;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'The search query',
    required: false,
    example: 'John Doe',
  })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
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

