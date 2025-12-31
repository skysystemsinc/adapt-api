import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class HumanResourcesChecklistDto {
  @ApiProperty({
    type: Boolean,
    description: 'Whether QC personnel is available',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  qcPersonnel!: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'QC personnel certificate as base64 encoded string or document ID (required if qcPersonnel is true)',
    example: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMy...',
  })
  @ValidateIf((o) => o.qcPersonnel === true)
  @IsNotEmpty({ message: 'qcPersonnelFile is required when qcPersonnel is true' })
  @IsString()
  qcPersonnelFile?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for QC personnel certificate (required if qcPersonnelFile is base64)',
  })
  @IsOptional()
  @IsString()
  qcPersonnelFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for QC personnel certificate (required if qcPersonnelFile is base64)',
  })
  @IsOptional()
  @IsString()
  qcPersonnelFileMimeType?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Whether warehouse supervisor is available',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  warehouseSupervisor!: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Warehouse supervisor certificate as base64 encoded string or document ID (required if warehouseSupervisor is true)',
  })
  @ValidateIf((o) => o.warehouseSupervisor === true)
  @IsNotEmpty({ message: 'warehouseSupervisorFile is required when warehouseSupervisor is true' })
  @IsString()
  warehouseSupervisorFile?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for warehouse supervisor certificate (required if warehouseSupervisorFile is base64)',
  })
  @IsOptional()
  @IsString()
  warehouseSupervisorFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for warehouse supervisor certificate (required if warehouseSupervisorFile is base64)',
  })
  @IsOptional()
  @IsString()
  warehouseSupervisorFileMimeType?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Whether data entry operator is available',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  dataEntryOperator!: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Data entry operator certificate as base64 encoded string or document ID (required if dataEntryOperator is true)',
  })
  @ValidateIf((o) => o.dataEntryOperator === true)
  @IsNotEmpty({ message: 'dataEntryOperatorFile is required when dataEntryOperator is true' })
  @IsString()
  dataEntryOperatorFile?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for data entry operator certificate (required if dataEntryOperatorFile is base64)',
  })
  @IsOptional()
  @IsString()
  dataEntryOperatorFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for data entry operator certificate (required if dataEntryOperatorFile is base64)',
  })
  @IsOptional()
  @IsString()
  dataEntryOperatorFileMimeType?: string;
}

export class FinancialSoundnessChecklistDto {
  @ApiProperty({
    type: Boolean,
    description: 'Whether audited financial statements are maintained',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  auditedFinancialStatements!: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Audited financial statements as base64 encoded string or document ID (required if auditedFinancialStatements is true)',
  })
  @ValidateIf((o) => o.auditedFinancialStatements === true)
  @IsNotEmpty({ message: 'auditedFinancialStatementsFile is required when auditedFinancialStatements is true' })
  @IsString()
  auditedFinancialStatementsFile?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for audited financial statements (required if auditedFinancialStatementsFile is base64)',
  })
  @IsOptional()
  @IsString()
  auditedFinancialStatementsFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for audited financial statements (required if auditedFinancialStatementsFile is base64)',
  })
  @IsOptional()
  @IsString()
  auditedFinancialStatementsFileMimeType?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Whether positive net worth is maintained',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  positiveNetWorth!: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Positive net worth proof as base64 encoded string or document ID (required if positiveNetWorth is true)',
  })
  @ValidateIf((o) => o.positiveNetWorth === true)
  @IsNotEmpty({ message: 'positiveNetWorthFile is required when positiveNetWorth is true' })
  @IsString()
  positiveNetWorthFile?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for positive net worth proof (required if positiveNetWorthFile is base64)',
  })
  @IsOptional()
  @IsString()
  positiveNetWorthFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for positive net worth proof (required if positiveNetWorthFile is base64)',
  })
  @IsOptional()
  @IsString()
  positiveNetWorthFileMimeType?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Whether there are no loan defaults',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  noLoanDefaults!: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'No loan defaults certificate as base64 encoded string or document ID (required if noLoanDefaults is true)',
  })
  @ValidateIf((o) => o.noLoanDefaults === true)
  @IsNotEmpty({ message: 'noLoanDefaultsFile is required when noLoanDefaults is true' })
  @IsString()
  noLoanDefaultsFile?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for no loan defaults certificate (required if noLoanDefaultsFile is base64)',
  })
  @IsOptional()
  @IsString()
  noLoanDefaultsFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for no loan defaults certificate (required if noLoanDefaultsFile is base64)',
  })
  @IsOptional()
  @IsString()
  noLoanDefaultsFileMimeType?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Whether clean credit history is maintained',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  cleanCreditHistory!: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'CIB report as base64 encoded string or document ID (required if cleanCreditHistory is true)',
  })
  @ValidateIf((o) => o.cleanCreditHistory === true)
  @IsNotEmpty({ message: 'cleanCreditHistoryFile is required when cleanCreditHistory is true' })
  @IsString()
  cleanCreditHistoryFile?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for CIB report (required if cleanCreditHistoryFile is base64)',
  })
  @IsOptional()
  @IsString()
  cleanCreditHistoryFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for CIB report (required if cleanCreditHistoryFile is base64)',
  })
  @IsOptional()
  @IsString()
  cleanCreditHistoryFileMimeType?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Whether adequate working capital is available',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  adequateWorkingCapital!: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Adequate working capital proof as base64 encoded string or document ID (required if adequateWorkingCapital is true)',
  })
  @ValidateIf((o) => o.adequateWorkingCapital === true)
  @IsNotEmpty({ message: 'adequateWorkingCapitalFile is required when adequateWorkingCapital is true' })
  @IsString()
  adequateWorkingCapitalFile?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for adequate working capital proof (required if adequateWorkingCapitalFile is base64)',
  })
  @IsOptional()
  @IsString()
  adequateWorkingCapitalFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for adequate working capital proof (required if adequateWorkingCapitalFile is base64)',
  })
  @IsOptional()
  @IsString()
  adequateWorkingCapitalFileMimeType?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Whether valid insurance coverage is maintained',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  validInsuranceCoverage!: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Insurance policies as base64 encoded string or document ID (required if validInsuranceCoverage is true)',
  })
  @ValidateIf((o) => o.validInsuranceCoverage === true)
  @IsNotEmpty({ message: 'validInsuranceCoverageFile is required when validInsuranceCoverage is true' })
  @IsString()
  validInsuranceCoverageFile?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for insurance policies (required if validInsuranceCoverageFile is base64)',
  })
  @IsOptional()
  @IsString()
  validInsuranceCoverageFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for insurance policies (required if validInsuranceCoverageFile is base64)',
  })
  @IsOptional()
  @IsString()
  validInsuranceCoverageFileMimeType?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Whether there are no financial fraud cases',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  noFinancialFraud!: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'No financial fraud declaration as base64 encoded string or document ID (required if noFinancialFraud is true)',
  })
  @ValidateIf((o) => o.noFinancialFraud === true)
  @IsNotEmpty({ message: 'noFinancialFraudFile is required when noFinancialFraud is true' })
  @IsString()
  noFinancialFraudFile?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for no financial fraud declaration (required if noFinancialFraudFile is base64)',
  })
  @IsOptional()
  @IsString()
  noFinancialFraudFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for no financial fraud declaration (required if noFinancialFraudFile is base64)',
  })
  @IsOptional()
  @IsString()
  noFinancialFraudFileMimeType?: string;
}

export class RegistrationFeeChecklistDto {
  @ApiProperty({
    type: String,
    description: 'Bank payment slip as base64 encoded string or document ID (required)',
    example: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMy...',
  })
  @IsNotEmpty({ message: 'bankPaymentSlip is required' })
  @IsString()
  bankPaymentSlip!: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Original filename for bank payment slip (required if bankPaymentSlip is base64)',
  })
  @IsOptional()
  @IsString()
  bankPaymentSlipFileName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'MIME type for bank payment slip (required if bankPaymentSlip is base64)',
  })
  @IsOptional()
  @IsString()
  bankPaymentSlipMimeType?: string;
}

export class DeclarationChecklistDto {
  @ApiProperty({
    type: Boolean,
    description: 'Confirmation that all information is true and complete',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  informationTrueComplete!: boolean;

  @ApiProperty({
    type: Boolean,
    description: 'Authorization for regulatory authority to verify documents',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  authorizeVerification!: boolean;
}

export class CreateApplicantChecklistDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'ID of existing applicant checklist (for updates)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    type: HumanResourcesChecklistDto,
    description: 'Human resources checklist information',
  })
  @ValidateNested()
  @Type(() => HumanResourcesChecklistDto)
  humanResources!: HumanResourcesChecklistDto;

  @ApiProperty({
    type: FinancialSoundnessChecklistDto,
    description: 'Financial soundness checklist information',
  })
  @ValidateNested()
  @Type(() => FinancialSoundnessChecklistDto)
  financialSoundness!: FinancialSoundnessChecklistDto;

  @ApiProperty({
    type: RegistrationFeeChecklistDto,
    description: 'Registration fee checklist information',
  })
  @ValidateNested()
  @Type(() => RegistrationFeeChecklistDto)
  registrationFee!: RegistrationFeeChecklistDto;

  @ApiProperty({
    type: DeclarationChecklistDto,
    description: 'Declaration checklist information',
  })
  @ValidateNested()
  @Type(() => DeclarationChecklistDto)
  declaration!: DeclarationChecklistDto;
}

