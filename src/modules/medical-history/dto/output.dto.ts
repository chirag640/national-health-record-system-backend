import { Expose, Type } from 'class-transformer';

// Allergy Output DTOs
export class AllergyReactionOutputDto {
  @Expose()
  symptom!: string;

  @Expose()
  severity!: string;

  @Expose()
  onset!: string;
}

export class AllergyOutputDto {
  @Expose()
  id!: string;

  @Expose()
  patientId!: string;

  @Expose()
  hospitalId?: string;

  @Expose()
  recordedByDoctorId?: string;

  @Expose()
  allergen!: string;

  @Expose()
  allergyType!: string;

  @Expose()
  severity!: string;

  @Expose()
  status!: string;

  @Expose()
  @Type(() => AllergyReactionOutputDto)
  reactions?: AllergyReactionOutputDto[];

  @Expose()
  onsetDate?: Date;

  @Expose()
  identifiedDate?: Date;

  @Expose()
  notes?: string;

  @Expose()
  clinicalStatus?: string;

  @Expose()
  verificationStatus?: string;

  @Expose()
  snomedCode?: string;

  @Expose()
  icd10Code?: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}

export class PaginatedAllergyOutputDto {
  @Expose()
  @Type(() => AllergyOutputDto)
  data!: AllergyOutputDto[];

  @Expose()
  total!: number;

  @Expose()
  page!: number;

  @Expose()
  limit!: number;

  @Expose()
  totalPages!: number;
}

// Chronic Condition Output DTOs
export class ConditionMedicationOutputDto {
  @Expose()
  medicationName!: string;

  @Expose()
  prescriptionId?: string;

  @Expose()
  dosage?: string;

  @Expose()
  frequency?: string;

  @Expose()
  startDate?: Date;

  @Expose()
  isActive?: boolean;
}

export class ChronicConditionOutputDto {
  @Expose()
  id!: string;

  @Expose()
  patientId!: string;

  @Expose()
  hospitalId?: string;

  @Expose()
  diagnosedByDoctorId?: string;

  @Expose()
  conditionName!: string;

  @Expose()
  diagnosisDate!: Date;

  @Expose()
  status!: string;

  @Expose()
  severity?: string;

  @Expose()
  icd10Code?: string;

  @Expose()
  snomedCode?: string;

  @Expose()
  @Type(() => ConditionMedicationOutputDto)
  medications?: ConditionMedicationOutputDto[];

  @Expose()
  treatmentPlan?: string;

  @Expose()
  monitoringFrequency?: string;

  @Expose()
  lastReviewDate?: Date;

  @Expose()
  nextReviewDate?: Date;

  @Expose()
  complications?: string[];

  @Expose()
  riskFactors?: string[];

  @Expose()
  lifestyleRecommendations?: string;

  @Expose()
  notes?: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}

export class PaginatedChronicConditionOutputDto {
  @Expose()
  @Type(() => ChronicConditionOutputDto)
  data!: ChronicConditionOutputDto[];

  @Expose()
  total!: number;

  @Expose()
  page!: number;

  @Expose()
  limit!: number;

  @Expose()
  totalPages!: number;
}

// Surgical History Output DTOs
export class SurgeryComplicationOutputDto {
  @Expose()
  description!: string;

  @Expose()
  severity?: string;

  @Expose()
  treatment?: string;

  @Expose()
  resolved?: boolean;
}

export class SurgicalHistoryOutputDto {
  @Expose()
  id!: string;

  @Expose()
  patientId!: string;

  @Expose()
  hospitalId?: string;

  @Expose()
  surgeonId?: string;

  @Expose()
  surgeryName!: string;

  @Expose()
  surgeryDate!: Date;

  @Expose()
  surgeryType!: string;

  @Expose()
  indication?: string;

  @Expose()
  procedureDetails?: string;

  @Expose()
  cptCode?: string;

  @Expose()
  icd10Code?: string;

  @Expose()
  anesthesiaType?: string;

  @Expose()
  duration?: number;

  @Expose()
  outcome?: string;

  @Expose()
  @Type(() => SurgeryComplicationOutputDto)
  complications?: SurgeryComplicationOutputDto[];

  @Expose()
  surgicalApproach?: string;

  @Expose()
  estimatedBloodLoss?: number;

  @Expose()
  transfusionRequired?: boolean;

  @Expose()
  dischargeDate?: Date;

  @Expose()
  recoveryNotes?: string;

  @Expose()
  followUpRequired?: boolean;

  @Expose()
  followUpDate?: Date;

  @Expose()
  implantUsed?: boolean;

  @Expose()
  implantDetails?: string;

  @Expose()
  pathologyReport?: string;

  @Expose()
  notes?: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}

export class PaginatedSurgicalHistoryOutputDto {
  @Expose()
  @Type(() => SurgicalHistoryOutputDto)
  data!: SurgicalHistoryOutputDto[];

  @Expose()
  total!: number;

  @Expose()
  page!: number;

  @Expose()
  limit!: number;

  @Expose()
  totalPages!: number;
}

// Family History Output DTOs
export class FamilyHistoryOutputDto {
  @Expose()
  id!: string;

  @Expose()
  patientId!: string;

  @Expose()
  hospitalId?: string;

  @Expose()
  recordedByDoctorId?: string;

  @Expose()
  relationship!: string;

  @Expose()
  relativeName?: string;

  @Expose()
  relativeAge?: number;

  @Expose()
  isAlive?: boolean;

  @Expose()
  ageAtDeath?: number;

  @Expose()
  causeOfDeath?: string;

  @Expose()
  condition!: string;

  @Expose()
  conditionDetails?: string;

  @Expose()
  diagnosisAge?: number;

  @Expose()
  icd10Code?: string;

  @Expose()
  snomedCode?: string;

  @Expose()
  inheritancePattern?: string;

  @Expose()
  patientRiskLevel?: string;

  @Expose()
  screeningRecommendations?: string;

  @Expose()
  notes?: string;

  @Expose()
  verificationStatus?: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}

export class PaginatedFamilyHistoryOutputDto {
  @Expose()
  @Type(() => FamilyHistoryOutputDto)
  data!: FamilyHistoryOutputDto[];

  @Expose()
  total!: number;

  @Expose()
  page!: number;

  @Expose()
  limit!: number;

  @Expose()
  totalPages!: number;
}

// Immunization Output DTOs
export class VaccineDoseOutputDto {
  @Expose()
  doseNumber!: number;

  @Expose()
  administeredDate!: Date;

  @Expose()
  expirationDate?: Date;

  @Expose()
  lotNumber?: string;

  @Expose()
  manufacturer?: string;

  @Expose()
  site?: string;

  @Expose()
  route!: string;

  @Expose()
  administeredBy?: string;

  @Expose()
  adverseReactions?: string[];
}

export class ImmunizationOutputDto {
  @Expose()
  id!: string;

  @Expose()
  patientId!: string;

  @Expose()
  hospitalId?: string;

  @Expose()
  prescribedByDoctorId?: string;

  @Expose()
  vaccineName!: string;

  @Expose()
  vaccineCode?: string;

  @Expose()
  status!: string;

  @Expose()
  targetDisease?: string;

  @Expose()
  @Type(() => VaccineDoseOutputDto)
  doses?: VaccineDoseOutputDto[];

  @Expose()
  totalDosesRequired?: number;

  @Expose()
  isSeriesComplete?: boolean;

  @Expose()
  nextDueDate?: Date;

  @Expose()
  fundingSource?: string;

  @Expose()
  educationProvided?: boolean;

  @Expose()
  consentObtained?: boolean;

  @Expose()
  consentId?: string;

  @Expose()
  notes?: string;

  @Expose()
  reasonNotGiven?: string;

  @Expose()
  snomedCode?: string;

  @Expose()
  loincCode?: string;

  @Expose()
  reminderSent?: boolean;

  @Expose()
  reminderDate?: Date;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}

export class PaginatedImmunizationOutputDto {
  @Expose()
  @Type(() => ImmunizationOutputDto)
  data!: ImmunizationOutputDto[];

  @Expose()
  total!: number;

  @Expose()
  page!: number;

  @Expose()
  limit!: number;

  @Expose()
  totalPages!: number;
}

// Vital Signs Output DTOs
export class VitalSignsOutputDto {
  @Expose()
  id!: string;

  @Expose()
  patientId!: string;

  @Expose()
  hospitalId?: string;

  @Expose()
  recordedByDoctorId?: string;

  @Expose()
  encounterId?: string;

  @Expose()
  telemedicineSessionId?: string;

  @Expose()
  recordedAt!: Date;

  @Expose()
  systolicBP?: number;

  @Expose()
  diastolicBP?: number;

  @Expose()
  bpPosition?: string;

  @Expose()
  heartRate?: number;

  @Expose()
  pulseRhythm?: string;

  @Expose()
  respiratoryRate?: number;

  @Expose()
  oxygenSaturation?: number;

  @Expose()
  supplementalO2?: number;

  @Expose()
  temperature?: number;

  @Expose()
  temperatureUnit?: string;

  @Expose()
  temperatureSite?: string;

  @Expose()
  height?: number;

  @Expose()
  weight?: number;

  @Expose()
  bmi?: number;

  @Expose()
  waistCircumference?: number;

  @Expose()
  hipCircumference?: number;

  @Expose()
  painScore?: number;

  @Expose()
  painLocation?: string;

  @Expose()
  bloodGlucose?: number;

  @Expose()
  glucoseMeasurementType?: string;

  @Expose()
  peakExpiratoryFlow?: number;

  @Expose()
  notes?: string;

  @Expose()
  hasAbnormalValues?: boolean;

  @Expose()
  abnormalFlags?: string[];

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}

export class PaginatedVitalSignsOutputDto {
  @Expose()
  @Type(() => VitalSignsOutputDto)
  data!: VitalSignsOutputDto[];

  @Expose()
  total!: number;

  @Expose()
  page!: number;

  @Expose()
  limit!: number;

  @Expose()
  totalPages!: number;
}
