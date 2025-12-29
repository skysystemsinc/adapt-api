import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { UnlockRequestStatus } from "src/modules/warehouse/entities/unlock-request.entity";

export class UnlockRequestApprovalDto {
    @ApiProperty({
        description: 'Review decision',
        enum: UnlockRequestStatus,
        example: UnlockRequestStatus.UNLOCKED,
      })
      @IsEnum(UnlockRequestStatus)
      @IsNotEmpty()
      status: UnlockRequestStatus.UNLOCKED | UnlockRequestStatus.REJECTED;

      @ApiProperty({
        description: 'Remarks (optional)',
        required: false,
        example: 'Bank slip verified and payment confirmed',
      })
      @IsString()
      @IsOptional()
      remarks?: string;
}