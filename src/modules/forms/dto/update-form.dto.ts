import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateFormDto {
  @ApiProperty({
    description: 'Form title',
    example: 'Updated Registration Form',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Form description',
    example: 'Updated description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Complete form schema from frontend builder',
    example: {
      id: 'registration',
      title: 'Updated Registration Form',
      description: '',
      steps: [],
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  schema?: Record<string, any>;
}

