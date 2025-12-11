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
import { SurgeryType, SurgeryOutcome } from '../schemas/surgical-history.schema';

export class SurgeryComplicationDto {
  @IsString()
  complication!: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsBoolean()
  resolved?: boolean;

  @IsOptional()
  @IsString()
  treatmentProvided?: string;
}

export class CreateSurgicalHistoryDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsString()
  surgeonId?: string;

  @IsString()
  surgeryName!: string;

  @IsDate()
  @Type(() => Date)
  surgeryDate!: Date;

  @IsEnum(SurgeryType)
  surgeryType!: SurgeryType;

  @IsOptional()
  @IsString()
  indication?: string;

  @IsOptional()
  @IsString()
  procedure?: string;

  @IsOptional()
  @IsString()
  surgeonName?: string;

  @IsOptional()
  @IsString()
  anesthesiologist?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assistingSurgeons?: string[];

  @IsOptional()
  @IsString()
  anesthesiaType?: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  bloodLoss?: number;

  @IsOptional()
  @IsBoolean()
  transfusionRequired?: boolean;

  @IsOptional()
  @IsEnum(SurgeryOutcome)
  outcome?: SurgeryOutcome;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurgeryComplicationDto)
  complications?: SurgeryComplicationDto[];

  @IsOptional()
  @IsNumber()
  hospitalStayDays?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dischargeDate?: Date;

  @IsOptional()
  @IsString()
  recoveryNotes?: string;

  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  followUpDate?: Date;

  @IsOptional()
  @IsString()
  cptCode?: string;

  @IsOptional()
  @IsString()
  icd10ProcedureCode?: string;

  @IsOptional()
  @IsString()
  pathologyReport?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  implants?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSurgicalHistoryDto {
  @IsOptional()
  @IsString()
  surgeryName?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  surgeryDate?: Date;

  @IsOptional()
  @IsEnum(SurgeryType)
  surgeryType?: SurgeryType;

  @IsOptional()
  @IsString()
  indication?: string;

  @IsOptional()
  @IsString()
  procedure?: string;

  @IsOptional()
  @IsString()
  surgeonName?: string;

  @IsOptional()
  @IsString()
  anesthesiologist?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assistingSurgeons?: string[];

  @IsOptional()
  @IsString()
  anesthesiaType?: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  bloodLoss?: number;

  @IsOptional()
  @IsBoolean()
  transfusionRequired?: boolean;

  @IsOptional()
  @IsEnum(SurgeryOutcome)
  outcome?: SurgeryOutcome;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurgeryComplicationDto)
  complications?: SurgeryComplicationDto[];

  @IsOptional()
  @IsNumber()
  hospitalStayDays?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dischargeDate?: Date;

  @IsOptional()
  @IsString()
  recoveryNotes?: string;

  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  followUpDate?: Date;

  @IsOptional()
  @IsString()
  cptCode?: string;

  @IsOptional()
  @IsString()
  icd10ProcedureCode?: string;

  @IsOptional()
  @IsString()
  pathologyReport?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  implants?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SurgicalHistoryFilterDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsEnum(SurgeryType)
  surgeryType?: SurgeryType;

  @IsOptional()
  @IsEnum(SurgeryOutcome)
  outcome?: SurgeryOutcome;

  @IsOptional()
  @IsString()
  search?: string;

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
