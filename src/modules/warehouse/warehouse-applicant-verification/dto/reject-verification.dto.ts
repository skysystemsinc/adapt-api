import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class RejectVerificationDto {
    @IsString()
    remarks: string;

    @IsUUID()
    @IsNotEmpty({ message: 'Application ID is required' })
    applicationId: string;
}

