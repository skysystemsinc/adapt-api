import { IsOptional, IsEnum, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
// import { ApplicationStatus } from '../entities/registration-application.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryOperatorApplicationDto {
  // @IsOptional()
  // @IsEnum(ApplicationStatus)
  // @ApiPropertyOptional({
  //   description: 'The status of the registration application',
  //   required: false,
  //   enum: ApplicationStatus,
  //   example: ApplicationStatus.PENDING,
  // })
  // status?: ApplicationStatus | undefined;

  // @IsOptional()
  // @IsString()
  // @ApiPropertyOptional({
  //   description: 'The ID of the application type',
  //   required: false,
  //   example: '123e4567-e89b-12d3-a456-426614174000',
  // })
  // applicationTypeId?: string;

  // @IsOptional()
  // @IsString()
  // @ApiPropertyOptional({
  //   description: 'The search query',
  //   required: false,
  //   example: 'John Doe',
  // })
  // search?: string;

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

