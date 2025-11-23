import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto';
import { OrganizationStatus } from '../entities/organization.entity';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @ApiProperty({ description: 'The status of the organization', enum: OrganizationStatus, required: false })
  @IsEnum(OrganizationStatus, { message: 'Invalid organization status' })
  @IsOptional()
  status?: OrganizationStatus;
}
