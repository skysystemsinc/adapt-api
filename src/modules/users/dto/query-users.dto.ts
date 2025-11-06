import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum UserTypeFilter {
  APPLICANT = 'applicant',
  INTERNAL_USERS = 'internal-users',
}

export class QueryUsersDto {
  @ApiProperty({
    description: 'Filter by user type',
    enum: UserTypeFilter,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserTypeFilter)
  type?: UserTypeFilter;

  @ApiProperty({
    description: 'Page number',
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

