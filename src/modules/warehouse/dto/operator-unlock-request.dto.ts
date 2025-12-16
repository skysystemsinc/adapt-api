import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class OperatorUnlockRequestDto {
  @ApiProperty({
    description: 'Remarks for the unlock request',
    example: 'I have uploaded the bank slip and I want to unlock my application',
  })
  @MaxLength(255)
  @MinLength(1)
  @IsNotEmpty({ message: 'remarks is required' })
  @IsString()
  remarks!: string;

  @ApiProperty({
    description: 'Bank slip for the unlock request',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'Bank Payment Slip is required' })
  bankPaymentSlip!: string;
}

