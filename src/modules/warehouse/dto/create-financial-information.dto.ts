import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class AuditReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  periodStart!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  periodEnd!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  assets!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  liabilities!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  equity!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  revenue!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  netProfitLoss!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  remarks?: string;
}

export class TaxReturnDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  periodStart!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  periodEnd!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  remarks?: string;
}

export class BankStatementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  periodStart!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  periodEnd!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  remarks?: string;
}

export class OthersDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  periodStart!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  periodEnd!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  remarks?: string;

  @IsOptional()
  @IsUUID()
  document?: string; // Document ID for existing documents
}

export class CreateFinancialInformationDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @ValidateNested()
  @Type(() => AuditReportDto)
  auditReport!: AuditReportDto;

  @ValidateNested()
  @Type(() => TaxReturnDto)
  taxReturn!: TaxReturnDto;

  @ValidateNested()
  @Type(() => BankStatementDto)
  bankStatement!: BankStatementDto;

  @ValidateNested()
  @Type(() => OthersDto)
  other!: OthersDto;
}

