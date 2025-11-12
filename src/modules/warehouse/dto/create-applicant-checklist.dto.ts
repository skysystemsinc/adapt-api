import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class HumanResourcesChecklistDto {
  @IsBoolean()
  @IsNotEmpty()
  qcPersonnel!: boolean;

  @IsOptional()
  @IsUUID()
  qcPersonnelFile?: string;

  @IsBoolean()
  @IsNotEmpty()
  warehouseSupervisor!: boolean;

  @IsOptional()
  @IsUUID()
  warehouseSupervisorFile?: string;

  @IsBoolean()
  @IsNotEmpty()
  dataEntryOperator!: boolean;

  @IsOptional()
  @IsUUID()
  dataEntryOperatorFile?: string;
}

export class FinancialSoundnessChecklistDto {
  @IsBoolean()
  @IsNotEmpty()
  auditedFinancialStatements!: boolean;

  @IsOptional()
  @IsUUID()
  auditedFinancialStatementsFile?: string;

  @IsBoolean()
  @IsNotEmpty()
  positiveNetWorth!: boolean;

  @IsOptional()
  @IsUUID()
  positiveNetWorthFile?: string;

  @IsBoolean()
  @IsNotEmpty()
  noLoanDefaults!: boolean;

  @IsOptional()
  @IsUUID()
  noLoanDefaultsFile?: string;

  @IsBoolean()
  @IsNotEmpty()
  cleanCreditHistory!: boolean;

  @IsOptional()
  @IsUUID()
  cleanCreditHistoryFile?: string;

  @IsBoolean()
  @IsNotEmpty()
  adequateWorkingCapital!: boolean;

  @IsOptional()
  @IsUUID()
  adequateWorkingCapitalFile?: string;

  @IsBoolean()
  @IsNotEmpty()
  validInsuranceCoverage!: boolean;

  @IsOptional()
  @IsUUID()
  validInsuranceCoverageFile?: string;

  @IsBoolean()
  @IsNotEmpty()
  noFinancialFraud!: boolean;

  @IsOptional()
  @IsUUID()
  noFinancialFraudFile?: string;
}

export class RegistrationFeeChecklistDto {
  @IsOptional()
  @IsUUID()
  bankPaymentSlip?: string;
}

export class DeclarationChecklistDto {
  @IsBoolean()
  @IsNotEmpty()
  informationTrueComplete!: boolean;

  @IsBoolean()
  @IsNotEmpty()
  authorizeVerification!: boolean;
}

export class CreateApplicantChecklistDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @ValidateNested()
  @Type(() => HumanResourcesChecklistDto)
  humanResources!: HumanResourcesChecklistDto;

  @ValidateNested()
  @Type(() => FinancialSoundnessChecklistDto)
  financialSoundness!: FinancialSoundnessChecklistDto;

  @ValidateNested()
  @Type(() => RegistrationFeeChecklistDto)
  registrationFee!: RegistrationFeeChecklistDto;

  @ValidateNested()
  @Type(() => DeclarationChecklistDto)
  declaration!: DeclarationChecklistDto;
}

