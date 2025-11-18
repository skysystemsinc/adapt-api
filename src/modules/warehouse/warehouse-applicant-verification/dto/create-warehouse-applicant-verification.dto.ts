import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApprovalStatus } from "src/common/enums/ApprovalStatus";
import { EntityType } from "src/common/enums/WarehouseApplicantEntityType";

export class CreateWarehouseApplicantVerificationDto {
    @IsString()
    entityId: string;

    @IsEnum(EntityType)
    entityType: EntityType;

    @IsString()
    fieldKey: string;

    @IsOptional()
    @IsString()
    fieldValue?: string;

    @IsOptional()
    @IsEnum(ApprovalStatus)
    status?: ApprovalStatus;

    @IsOptional()
    @IsString()
    remarks?: string;

    @IsOptional()
    @IsString()
    approvedBy?: string;

    @IsOptional()
    @IsString()
    rejectedBy?: string;
}
