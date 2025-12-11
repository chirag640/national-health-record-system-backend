import { IsString, IsEnum, IsOptional, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AllergyType, AllergySeverity, AllergyStatus } from '../schemas/allergy.schema';

// === ALLERGY DTOs ===

export class AllergyReactionDto {
  @IsString()
  symptom!: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  onset?: string;
}

export class CreateAllergyDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsString()
  reportedByDoctorId?: string;

  @IsString()
  allergen!: string;

  @IsEnum(AllergyType)
  type!: AllergyType;

  @IsEnum(AllergySeverity)
  severity!: AllergySeverity;

  @IsOptional()
  @IsEnum(AllergyStatus)
  status?: AllergyStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllergyReactionDto)
  reactions?: AllergyReactionDto[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  diagnosedDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastReactionDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  verificationStatus?: string;

  @IsOptional()
  @IsString()
  snomedCode?: string;

  @IsOptional()
  @IsString()
  icd10Code?: string;
}

export class UpdateAllergyDto {
  @IsOptional()
  @IsString()
  allergen?: string;

  @IsOptional()
  @IsEnum(AllergyType)
  type?: AllergyType;

  @IsOptional()
  @IsEnum(AllergySeverity)
  severity?: AllergySeverity;

  @IsOptional()
  @IsEnum(AllergyStatus)
  status?: AllergyStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllergyReactionDto)
  reactions?: AllergyReactionDto[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  diagnosedDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastReactionDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  verificationStatus?: string;

  @IsOptional()
  @IsString()
  snomedCode?: string;

  @IsOptional()
  @IsString()
  icd10Code?: string;
}

export class AllergyFilterDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsEnum(AllergyType)
  type?: AllergyType;

  @IsOptional()
  @IsEnum(AllergySeverity)
  severity?: AllergySeverity;

  @IsOptional()
  @IsEnum(AllergyStatus)
  status?: AllergyStatus;

  @IsOptional()
  @IsString()
  search?: string; // Search in allergen name

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
