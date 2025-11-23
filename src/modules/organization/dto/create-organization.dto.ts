import { IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { OrganizationType } from "../entities/organization.entity";

export class CreateOrganizationDto {
  @ApiProperty({ description: 'The name of the organization' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Name must be at most 50 characters long' })
  name: string;

  @ApiProperty({ description: 'The type of the organization', enum: OrganizationType })
  @IsEnum(OrganizationType, { message: 'Invalid organization type' })
  type: OrganizationType;
}
