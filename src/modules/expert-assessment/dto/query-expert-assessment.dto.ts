import { IsOptional, IsEnum, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentCategory } from '../entities/expert-assessment.entity';

export class QueryExpertAssessmentDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Filter by category',
    enum: AssessmentCategory
  })
  @IsEnum(AssessmentCategory)
  @IsOptional()
  category?: AssessmentCategory;

  @ApiPropertyOptional({ description: 'Search by name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by active status (true for active, false for inactive, undefined for all)',
    type: Boolean
  })
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;
}

