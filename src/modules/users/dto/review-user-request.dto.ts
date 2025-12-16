import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRequestStatus } from '../entities/user-request.entity';

export class ReviewUserRequestDto {
  @ApiProperty({
    description: 'Review decision',
    enum: UserRequestStatus,
    example: UserRequestStatus.APPROVED,
  })
  @IsEnum(UserRequestStatus)
  @IsNotEmpty()
  status: UserRequestStatus.APPROVED | UserRequestStatus.REJECTED;

  @ApiProperty({
    description: 'Review notes (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  reviewNotes?: string;
}
