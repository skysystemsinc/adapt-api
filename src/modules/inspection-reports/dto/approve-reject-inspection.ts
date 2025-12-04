import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsEnum, MaxLength, MinLength } from "class-validator";
import { InspectionReportStatus } from "../entities/inspection-report.entity";

export enum ApproveOrRejectInspectionReportStatus {
  APPROVED = InspectionReportStatus.APPROVED,
  REJECTED = InspectionReportStatus.REJECTED,
}

export class ApproveOrRejectInspectionReportDto {
  @ApiProperty({
    description: 'Status',
    enum: ApproveOrRejectInspectionReportStatus,
    example: ApproveOrRejectInspectionReportStatus.APPROVED
  })
  @IsEnum(ApproveOrRejectInspectionReportStatus)
  @IsNotEmpty()
  status: ApproveOrRejectInspectionReportStatus;

  @ApiProperty({
    description: 'Remarks',
    example: 'The inspection report is approved'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @MinLength(1)
  remarks: string;
}