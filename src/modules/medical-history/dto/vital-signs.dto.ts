import { IsString, IsOptional, IsDate, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVitalSignsDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsString()
  recordedByDoctorId?: string;

  @IsOptional()
  @IsString()
  encounterId?: string;

  @IsOptional()
  @IsString()
  telemedicineSessionId?: string;

  @IsDate()
  @Type(() => Date)
  recordedAt!: Date;

  // Blood Pressure
  @IsOptional()
  @IsNumber()
  systolicBP?: number;

  @IsOptional()
  @IsNumber()
  diastolicBP?: number;

  @IsOptional()
  @IsString()
  bpPosition?: string; // sitting, standing, lying

  // Heart Rate
  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @IsOptional()
  @IsString()
  pulseRhythm?: string; // regular, irregular

  // Respiratory
  @IsOptional()
  @IsNumber()
  respiratoryRate?: number;

  @IsOptional()
  @IsNumber()
  oxygenSaturation?: number;

  @IsOptional()
  @IsNumber()
  supplementalO2?: number; // Liters per minute

  // Temperature
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsString()
  temperatureUnit?: string; // celsius, fahrenheit

  @IsOptional()
  @IsString()
  temperatureSite?: string; // oral, axillary, rectal, tympanic

  // Body Measurements
  @IsOptional()
  @IsNumber()
  height?: number; // cm

  @IsOptional()
  @IsNumber()
  weight?: number; // kg

  @IsOptional()
  @IsNumber()
  bmi?: number; // Auto-calculated

  @IsOptional()
  @IsNumber()
  waistCircumference?: number; // cm

  @IsOptional()
  @IsNumber()
  hipCircumference?: number; // cm

  // Pain & Glucose
  @IsOptional()
  @IsNumber()
  painScore?: number; // 0-10 scale

  @IsOptional()
  @IsString()
  painLocation?: string;

  @IsOptional()
  @IsNumber()
  bloodGlucose?: number; // mg/dL

  @IsOptional()
  @IsString()
  glucoseMeasurementType?: string; // fasting, random, postprandial

  // Respiratory Function
  @IsOptional()
  @IsNumber()
  peakExpiratoryFlow?: number; // L/min

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  hasAbnormalValues?: boolean; // Auto-calculated

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  abnormalFlags?: string[]; // JSON string of abnormal measurements
}

export class UpdateVitalSignsDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  recordedAt?: Date;

  @IsOptional()
  @IsNumber()
  systolicBP?: number;

  @IsOptional()
  @IsNumber()
  diastolicBP?: number;

  @IsOptional()
  @IsString()
  bpPosition?: string;

  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @IsOptional()
  @IsString()
  pulseRhythm?: string;

  @IsOptional()
  @IsNumber()
  respiratoryRate?: number;

  @IsOptional()
  @IsNumber()
  oxygenSaturation?: number;

  @IsOptional()
  @IsNumber()
  supplementalO2?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsString()
  temperatureUnit?: string;

  @IsOptional()
  @IsString()
  temperatureSite?: string;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  bmi?: number;

  @IsOptional()
  @IsNumber()
  waistCircumference?: number;

  @IsOptional()
  @IsNumber()
  hipCircumference?: number;

  @IsOptional()
  @IsNumber()
  painScore?: number;

  @IsOptional()
  @IsString()
  painLocation?: string;

  @IsOptional()
  @IsNumber()
  bloodGlucose?: number;

  @IsOptional()
  @IsString()
  glucoseMeasurementType?: string;

  @IsOptional()
  @IsNumber()
  peakExpiratoryFlow?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  hasAbnormalValues?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  abnormalFlags?: string[];
}

export class VitalSignsFilterDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsString()
  encounterId?: string;

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
  @Type(() => Boolean)
  hasAbnormalValues?: boolean;

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
