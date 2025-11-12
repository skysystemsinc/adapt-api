import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class HrPersonalDetailsDto {
  @IsOptional()
  @IsUUID()
  designationId?: string;

  @IsOptional()
  @IsString()
  designationName?: string;

  @IsOptional()
  @IsString()
  photograph?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fathersHusbandName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  cnicPassport!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nationality!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsString()
  @IsNotEmpty()
  residentialAddress!: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsString()
  @IsNotEmpty()
  mobileNumber!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  nationalTaxNumber?: string;
}

export class HrAcademicQualificationDto {
  @IsString()
  @IsNotEmpty()
  degree!: string;

  @IsString()
  @IsNotEmpty()
  major!: string;

  @IsString()
  @IsNotEmpty()
  institute!: string;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsString()
  @IsNotEmpty()
  yearOfPassing!: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  academicCertificate?: string;
}

export class HrProfessionalQualificationDto {
  @IsString()
  @IsNotEmpty()
  certificationTitle!: string;

  @IsString()
  @IsNotEmpty()
  issuingBody!: string;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsString()
  @IsNotEmpty()
  dateOfAward!: string;

  @IsOptional()
  @IsString()
  validity?: string;

  @IsOptional()
  @IsString()
  membershipNumber?: string;

  @IsOptional()
  @IsString()
  professionalCertificate?: string;
}

export class HrTrainingDto {
  @IsString()
  @IsNotEmpty()
  trainingTitle!: string;

  @IsString()
  @IsNotEmpty()
  conductedBy!: string;

  @IsString()
  @IsNotEmpty()
  trainingType!: string;

  @IsString()
  @IsNotEmpty()
  durationStart!: string;

  @IsString()
  @IsNotEmpty()
  durationEnd!: string;

  @IsString()
  @IsNotEmpty()
  dateOfCompletion!: string;

  @IsOptional()
  @IsString()
  trainingCertificate?: string;
}

export class HrExperienceDto {
  @IsString()
  @IsNotEmpty()
  positionHeld!: string;

  @IsString()
  @IsNotEmpty()
  organizationName!: string;

  @IsString()
  @IsNotEmpty()
  organizationAddress!: string;

  @IsString()
  @IsNotEmpty()
  natureOfOrganization!: string;

  @IsString()
  @IsNotEmpty()
  dateOfAppointment!: string;

  @IsOptional()
  @IsString()
  dateOfLeaving?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @IsString()
  experienceLetter?: string;
}

export class HrDeclarationDto {
  @IsString()
  @IsNotEmpty()
  writeOffAvailed!: string;

  @IsString()
  @IsNotEmpty()
  defaultOfFinance!: string;

  @IsString()
  @IsNotEmpty()
  placementOnECL!: string;

  @IsString()
  @IsNotEmpty()
  convictionPleaBargain!: string;
}

export class UpsertHrInformationDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @ValidateNested()
  @Type(() => HrPersonalDetailsDto)
  personalDetails!: HrPersonalDetailsDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HrAcademicQualificationDto)
  academicQualifications!: HrAcademicQualificationDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HrProfessionalQualificationDto)
  professionalQualifications!: HrProfessionalQualificationDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HrTrainingDto)
  trainings!: HrTrainingDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HrExperienceDto)
  experiences!: HrExperienceDto[];

  @ValidateNested()
  @Type(() => HrDeclarationDto)
  declaration!: HrDeclarationDto;
}

