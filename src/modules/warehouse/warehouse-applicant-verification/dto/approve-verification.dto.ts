import { IsOptional, IsString } from "class-validator";

export class ApproveVerificationDto {
    @IsOptional()
    @IsString()
    remarks?: string;
}

