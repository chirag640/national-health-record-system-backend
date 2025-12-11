import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { FamilyRelationship } from '../schemas/family-history.schema';

export class CreateFamilyHistoryDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsString()
  recordedByDoctorId?: string;

  @IsEnum(FamilyRelationship)
  relationship!: FamilyRelationship;

  @IsOptional()
  @IsString()
  relativeName?: string;

  @IsOptional()
  @IsNumber()
  relativeAge?: number;

  @IsOptional()
  @IsBoolean()
  isAlive?: boolean;

  @IsOptional()
  @IsNumber()
  ageAtDeath?: number;

  @IsOptional()
  @IsString()
  causeOfDeath?: string;

  @IsString()
  condition!: string;

  @IsOptional()
  @IsString()
  conditionDetails?: string;

  @IsOptional()
  @IsNumber()
  diagnosisAge?: number;

  @IsOptional()
  @IsString()
  icd10Code?: string;

  @IsOptional()
  @IsString()
  snomedCode?: string;

  @IsOptional()
  @IsString()
  inheritancePattern?: string;

  @IsOptional()
  @IsString()
  patientRiskLevel?: string;

  @IsOptional()
  @IsString()
  screeningRecommendations?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  verificationStatus?: string;
}

export class UpdateFamilyHistoryDto {
  @IsOptional()
  @IsEnum(FamilyRelationship)
  relationship?: FamilyRelationship;

  @IsOptional()
  @IsString()
  relativeName?: string;

  @IsOptional()
  @IsNumber()
  relativeAge?: number;

  @IsOptional()
  @IsBoolean()
  isAlive?: boolean;

  @IsOptional()
  @IsNumber()
  ageAtDeath?: number;

  @IsOptional()
  @IsString()
  causeOfDeath?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  conditionDetails?: string;

  @IsOptional()
  @IsNumber()
  diagnosisAge?: number;

  @IsOptional()
  @IsString()
  icd10Code?: string;

  @IsOptional()
  @IsString()
  snomedCode?: string;

  @IsOptional()
  @IsString()
  inheritancePattern?: string;

  @IsOptional()
  @IsString()
  patientRiskLevel?: string;

  @IsOptional()
  @IsString()
  screeningRecommendations?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  verificationStatus?: string;
}

export class FamilyHistoryFilterDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsEnum(FamilyRelationship)
  relationship?: FamilyRelationship;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 20;
}
