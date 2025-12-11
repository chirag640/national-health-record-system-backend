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
import {
  ImmunizationStatus,
  ImmunizationRouteOfAdministration,
} from '../schemas/immunization.schema';

export class VaccineDoseDto {
  @IsNumber()
  doseNumber!: number;

  @IsDate()
  @Type(() => Date)
  administeredDate!: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expirationDate?: Date;

  @IsOptional()
  @IsString()
  lotNumber?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  site?: string;

  @IsEnum(ImmunizationRouteOfAdministration)
  route!: ImmunizationRouteOfAdministration;

  @IsOptional()
  @IsString()
  administeredBy?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  adverseReactions?: string[];
}

export class CreateImmunizationDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsString()
  prescribedByDoctorId?: string;

  @IsString()
  vaccineName!: string;

  @IsOptional()
  @IsString()
  vaccineCode?: string;

  @IsOptional()
  @IsEnum(ImmunizationStatus)
  status?: ImmunizationStatus;

  @IsOptional()
  @IsString()
  targetDisease?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VaccineDoseDto)
  doses?: VaccineDoseDto[];

  @IsOptional()
  @IsNumber()
  totalDosesRequired?: number;

  @IsOptional()
  @IsBoolean()
  isSeriesComplete?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  nextDueDate?: Date;

  @IsOptional()
  @IsString()
  fundingSource?: string;

  @IsOptional()
  @IsBoolean()
  educationProvided?: boolean;

  @IsOptional()
  @IsBoolean()
  consentObtained?: boolean;

  @IsOptional()
  @IsString()
  consentId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  reasonNotGiven?: string;

  @IsOptional()
  @IsString()
  snomedCode?: string;

  @IsOptional()
  @IsString()
  loincCode?: string;
}

export class UpdateImmunizationDto {
  @IsOptional()
  @IsString()
  vaccineName?: string;

  @IsOptional()
  @IsString()
  vaccineCode?: string;

  @IsOptional()
  @IsEnum(ImmunizationStatus)
  status?: ImmunizationStatus;

  @IsOptional()
  @IsString()
  targetDisease?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VaccineDoseDto)
  doses?: VaccineDoseDto[];

  @IsOptional()
  @IsNumber()
  totalDosesRequired?: number;

  @IsOptional()
  @IsBoolean()
  isSeriesComplete?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  nextDueDate?: Date;

  @IsOptional()
  @IsString()
  fundingSource?: string;

  @IsOptional()
  @IsBoolean()
  educationProvided?: boolean;

  @IsOptional()
  @IsBoolean()
  consentObtained?: boolean;

  @IsOptional()
  @IsString()
  consentId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  reasonNotGiven?: string;

  @IsOptional()
  @IsString()
  snomedCode?: string;

  @IsOptional()
  @IsString()
  loincCode?: string;

  @IsOptional()
  @IsBoolean()
  reminderSent?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reminderDate?: Date;
}

export class ImmunizationFilterDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsEnum(ImmunizationStatus)
  status?: ImmunizationStatus;

  @IsOptional()
  @IsString()
  vaccineName?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isSeriesComplete?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isDue?: boolean; // Filter for overdue vaccinations

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;
}
