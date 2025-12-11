import {
  IsString,
  IsEnum,
  IsOptional,
  IsDate,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConditionStatus, ConditionSeverity } from '../schemas/chronic-condition.schema';

export class ConditionMedicationDto {
  @IsOptional()
  @IsString()
  prescriptionId?: string;

  @IsString()
  medicationName!: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateChronicConditionDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsString()
  diagnosedByDoctorId?: string;

  @IsString()
  conditionName!: string;

  @IsOptional()
  @IsEnum(ConditionStatus)
  status?: ConditionStatus;

  @IsOptional()
  @IsEnum(ConditionSeverity)
  severity?: ConditionSeverity;

  @IsDate()
  @Type(() => Date)
  diagnosedDate!: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  onsetDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastReviewDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  nextReviewDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionMedicationDto)
  medications?: ConditionMedicationDto[];

  @IsOptional()
  @IsString()
  icd10Code?: string;

  @IsOptional()
  @IsString()
  snomedCode?: string;

  @IsOptional()
  @IsBoolean()
  monitoringRequired?: boolean;

  @IsOptional()
  @IsString()
  monitoringFrequency?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  complications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riskFactors?: string[];

  @IsOptional()
  @IsString()
  lifestyleRecommendations?: string;
}

export class UpdateChronicConditionDto {
  @IsOptional()
  @IsString()
  conditionName?: string;

  @IsOptional()
  @IsEnum(ConditionStatus)
  status?: ConditionStatus;

  @IsOptional()
  @IsEnum(ConditionSeverity)
  severity?: ConditionSeverity;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  diagnosedDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  onsetDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastReviewDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  nextReviewDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionMedicationDto)
  medications?: ConditionMedicationDto[];

  @IsOptional()
  @IsString()
  icd10Code?: string;

  @IsOptional()
  @IsString()
  snomedCode?: string;

  @IsOptional()
  @IsBoolean()
  monitoringRequired?: boolean;

  @IsOptional()
  @IsString()
  monitoringFrequency?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  complications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riskFactors?: string[];

  @IsOptional()
  @IsString()
  lifestyleRecommendations?: string;
}

export class ChronicConditionFilterDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsEnum(ConditionStatus)
  status?: ConditionStatus;

  @IsOptional()
  @IsEnum(ConditionSeverity)
  severity?: ConditionSeverity;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  monitoringRequired?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;
}
