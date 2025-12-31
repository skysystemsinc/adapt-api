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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[]; // Array of base64 strings or document IDs

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentFileNames?: string[]; // Array of filenames (required if documents contains base64)

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentMimeTypes?: string[]; // Array of MIME types (required if documents contains base64)
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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[]; // Array of base64 strings or document IDs

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentFileNames?: string[]; // Array of filenames (required if documents contains base64)

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentMimeTypes?: string[]; // Array of MIME types (required if documents contains base64)
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

  @IsOptional()
  @IsString()
  document?: string; // Base64 string or document ID

  @IsOptional()
  @IsString()
  documentFileName?: string; // Filename (required if document is base64)

  @IsOptional()
  @IsString()
  documentMimeType?: string; // MIME type (required if document is base64)
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
  @IsString()
  document?: string; // Base64 string or document ID

  @IsOptional()
  @IsString()
  documentFileName?: string; // Filename (required if document is base64)

  @IsOptional()
  @IsString()
  documentMimeType?: string; // MIME type (required if document is base64)
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

