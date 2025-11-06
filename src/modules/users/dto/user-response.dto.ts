import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ApplicantUserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty({ example: 'test' })
  @Expose()
  name: string;
}

export class InternalUserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  role: string;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [Object] })
  @Expose()
  data: ApplicantUserResponseDto[] | InternalUserResponseDto[];

  @ApiProperty()
  @Expose()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

