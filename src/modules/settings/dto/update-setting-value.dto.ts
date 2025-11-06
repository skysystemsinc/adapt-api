import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateSettingValueDto {
  @ApiProperty({ description: 'Setting value', example: 'New Value' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

