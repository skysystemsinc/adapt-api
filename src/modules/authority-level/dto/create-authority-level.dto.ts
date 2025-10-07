import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateAuthorityLevelDto {
  @ApiProperty({ description: 'Name of the authority level' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Slug for the authority level' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: 'Whether the authority level is active', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
