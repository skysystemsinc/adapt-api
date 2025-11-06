import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSettingDto {
  @ApiProperty({ description: 'Setting key', example: 'app.name' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Setting value', example: 'My Application' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

