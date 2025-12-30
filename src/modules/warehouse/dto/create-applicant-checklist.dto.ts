import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { BaseFileUploadDto } from 'src/common/dto/base-file-upload.dto';

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
    format: 'uuid',
    description: 'Document ID for QC personnel certificate (required if qcPersonnel is true)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf((o) => o.qcPersonnel === true)
  @IsNotEmpty({ message: 'qcPersonnelFile is required when qcPersonnel is true' })
  @IsUUID(undefined, { message: 'qcPersonnelFile must be a valid UUID' })
  qcPersonnelFile?: string;

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
    format: 'uuid',
    description: 'Document ID for warehouse supervisor certificate (required if warehouseSupervisor is true)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf((o) => o.warehouseSupervisor === true)
  @IsNotEmpty({ message: 'warehouseSupervisorFile is required when warehouseSupervisor is true' })
  @IsUUID(undefined, { message: 'warehouseSupervisorFile must be a valid UUID' })
  warehouseSupervisorFile?: string;

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
    format: 'uuid',
    description: 'Document ID for data entry operator certificate (required if dataEntryOperator is true)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf((o) => o.dataEntryOperator === true)
  @IsNotEmpty({ message: 'dataEntryOperatorFile is required when dataEntryOperator is true' })
  @IsUUID(undefined, { message: 'dataEntryOperatorFile must be a valid UUID' })
  dataEntryOperatorFile?: string;
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
    format: 'uuid',
    description: 'Document ID for audited financial statements (required if auditedFinancialStatements is true)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf((o) => o.auditedFinancialStatements === true)
  @IsNotEmpty({ message: 'auditedFinancialStatementsFile is required when auditedFinancialStatements is true' })
  @IsUUID(undefined, { message: 'auditedFinancialStatementsFile must be a valid UUID' })
  auditedFinancialStatementsFile?: string;

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
    format: 'uuid',
    description: 'Document ID for positive net worth proof (required if positiveNetWorth is true)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf((o) => o.positiveNetWorth === true)
  @IsNotEmpty({ message: 'positiveNetWorthFile is required when positiveNetWorth is true' })
  @IsUUID(undefined, { message: 'positiveNetWorthFile must be a valid UUID' })
  positiveNetWorthFile?: string;

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
    format: 'uuid',
    description: 'Document ID for no loan defaults certificate (required if noLoanDefaults is true)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf((o) => o.noLoanDefaults === true)
  @IsNotEmpty({ message: 'noLoanDefaultsFile is required when noLoanDefaults is true' })
  @IsUUID(undefined, { message: 'noLoanDefaultsFile must be a valid UUID' })
  noLoanDefaultsFile?: string;

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
    format: 'uuid',
    description: 'Document ID for CIB report (required if cleanCreditHistory is true)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf((o) => o.cleanCreditHistory === true)
  @IsNotEmpty({ message: 'cleanCreditHistoryFile is required when cleanCreditHistory is true' })
  @IsUUID(undefined, { message: 'cleanCreditHistoryFile must be a valid UUID' })
  cleanCreditHistoryFile?: string;

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
    format: 'uuid',
    description: 'Document ID for adequate working capital proof (required if adequateWorkingCapital is true)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf((o) => o.adequateWorkingCapital === true)
  @IsNotEmpty({ message: 'adequateWorkingCapitalFile is required when adequateWorkingCapital is true' })
  @IsUUID(undefined, { message: 'adequateWorkingCapitalFile must be a valid UUID' })
  adequateWorkingCapitalFile?: string;

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
    format: 'uuid',
    description: 'Document ID for insurance policies (required if validInsuranceCoverage is true)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf((o) => o.validInsuranceCoverage === true)
  @IsNotEmpty({ message: 'validInsuranceCoverageFile is required when validInsuranceCoverage is true' })
  @IsUUID(undefined, { message: 'validInsuranceCoverageFile must be a valid UUID' })
  validInsuranceCoverageFile?: string;

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
    format: 'uuid',
    description: 'Document ID for no financial fraud declaration (required if noFinancialFraud is true)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf((o) => o.noFinancialFraud === true)
  @IsNotEmpty({ message: 'noFinancialFraudFile is required when noFinancialFraud is true' })
  @IsUUID(undefined, { message: 'noFinancialFraudFile must be a valid UUID' })
  noFinancialFraudFile?: string;
}

export class RegistrationFeeChecklistDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Document ID for bank payment slip (required)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'bankPaymentSlip is required' })
  @IsUUID(undefined, { message: 'bankPaymentSlip must be a valid UUID' })
  bankPaymentSlip!: string;
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

  // Optional file uploads (base64 encoded) - for new file uploads
  @ApiPropertyOptional({ type: BaseFileUploadDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BaseFileUploadDto)
  qcPersonnelFile?: BaseFileUploadDto;

  @ApiPropertyOptional({ type: BaseFileUploadDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BaseFileUploadDto)
  warehouseSupervisorFile?: BaseFileUploadDto;

  @ApiPropertyOptional({ type: BaseFileUploadDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BaseFileUploadDto)
  dataEntryOperatorFile?: BaseFileUploadDto;

  @ApiPropertyOptional({ type: BaseFileUploadDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BaseFileUploadDto)
  auditedFinancialStatementsFile?: BaseFileUploadDto;

  @ApiPropertyOptional({ type: BaseFileUploadDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BaseFileUploadDto)
  positiveNetWorthFile?: BaseFileUploadDto;

  @ApiPropertyOptional({ type: BaseFileUploadDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BaseFileUploadDto)
  noLoanDefaultsFile?: BaseFileUploadDto;

  @ApiPropertyOptional({ type: BaseFileUploadDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BaseFileUploadDto)
  cleanCreditHistoryFile?: BaseFileUploadDto;

  @ApiPropertyOptional({ type: BaseFileUploadDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BaseFileUploadDto)
  adequateWorkingCapitalFile?: BaseFileUploadDto;

  @ApiPropertyOptional({ type: BaseFileUploadDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BaseFileUploadDto)
  validInsuranceCoverageFile?: BaseFileUploadDto;

  @ApiPropertyOptional({ type: BaseFileUploadDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BaseFileUploadDto)
  noFinancialFraudFile?: BaseFileUploadDto;

  @ApiPropertyOptional({ type: BaseFileUploadDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BaseFileUploadDto)
  bankPaymentSlip?: BaseFileUploadDto;
}

