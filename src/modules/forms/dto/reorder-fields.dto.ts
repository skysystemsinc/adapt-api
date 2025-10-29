import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsInt, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for individual field order update
 */
export class FieldOrderDto {
  @ApiProperty({
    description: 'Field ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'id must be a valid UUID' })
  @IsNotEmpty({ message: 'id is required' })
  id: string;

  @ApiProperty({
    description: 'New order position (0-based index)',
    example: 0,
    minimum: 0,
  })
  @IsInt({ message: 'order must be an integer' })
  @IsNotEmpty({ message: 'order is required' })
  order: number;

  @ApiProperty({
    description: 'Step number this field belongs to',
    example: 0,
    minimum: 0,
  })
  @IsInt({ message: 'step must be an integer' })
  @IsNotEmpty({ message: 'step is required' })
  step: number;
}

/**
 * DTO for reordering multiple fields
 * This wraps the array to work properly with ValidationPipe
 */
export class ReorderFieldsDto {
  @ApiProperty({
    description: 'Array of field orders with their new positions and steps',
    type: [FieldOrderDto],
    isArray: true,
    example: [
      { id: '123e4567-e89b-12d3-a456-426614174000', order: 0, step: 0 },
      { id: '223e4567-e89b-12d3-a456-426614174001', order: 1, step: 0 },
    ],
  })
  @IsArray({ message: 'fields must be an array' })
  @ValidateNested({ each: true, message: 'Each field must be a valid FieldOrderDto' })
  @Type(() => FieldOrderDto)
  @IsNotEmpty({ message: 'fields array cannot be empty' })
  fields!: FieldOrderDto[];
}
