import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';
import { FormRequestStatus } from '../entities/form-request.entity';

export class ReviewFormRequestDto {
  @ApiProperty({
    description: 'Review decision',
    enum: FormRequestStatus,
    example: FormRequestStatus.APPROVED,
  })
  @IsEnum(FormRequestStatus)
  @IsNotEmpty()
  status: FormRequestStatus;

  @ApiProperty({
    description: 'Review notes (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  reviewNotes?: string;

  @ApiProperty({
    description: 'Individual field decisions (fieldKey -> "approved" | "rejected")',
    required: false,
    example: { 'field-1': 'approved', 'field-2': 'rejected' },
  })
  @IsObject()
  @IsOptional()
  fieldDecisions?: Record<string, 'approved' | 'rejected'>;
}

