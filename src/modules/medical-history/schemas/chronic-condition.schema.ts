import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';
import { addSoftDeletePlugin } from '../../../common/soft-delete.plugin';

export type ChronicConditionDocument = ChronicCondition & MongooseDocument;

export enum ConditionStatus {
  ACTIVE = 'active',
  CONTROLLED = 'controlled',
  IN_REMISSION = 'in_remission',
  RESOLVED = 'resolved',
  INACTIVE = 'inactive',
}

export enum ConditionSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

@Schema({ _id: false })
export class ConditionMedication {
  @Prop({ type: Types.ObjectId, ref: 'Prescription' })
  prescriptionId!: Types.ObjectId;

  @Prop({ required: true })
  medicationName!: string;

  @Prop({ required: false })
  dosage!: string;

  @Prop({ required: false })
  frequency!: string;

  @Prop({ required: false })
  startDate!: Date;

  @Prop({ required: false })
  endDate!: Date;

  @Prop({ default: true })
  isActive!: boolean;
}

export const ConditionMedicationSchema = SchemaFactory.createForClass(ConditionMedication);

@Schema({ timestamps: true })
export class ChronicCondition extends MongooseDocument {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: false, index: true })
  hospitalId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: false })
  diagnosedByDoctorId!: Types.ObjectId;

  // Condition details
  @Prop({ required: true })
  conditionName!: string; // e.g., "Type 2 Diabetes", "Hypertension", "Asthma"

  @Prop({ type: String, enum: ConditionStatus, default: ConditionStatus.ACTIVE })
  status!: ConditionStatus;

  @Prop({ type: String, enum: ConditionSeverity, required: false })
  severity!: ConditionSeverity;

  // Clinical information
  @Prop({ required: true })
  diagnosedDate!: Date;

  @Prop({ required: false })
  onsetDate!: Date; // When symptoms first appeared

  @Prop({ required: false })
  lastReviewDate!: Date; // Last reviewed by doctor

  @Prop({ required: false })
  nextReviewDate!: Date; // Scheduled next review

  @Prop({ required: false })
  notes!: string;

  // Linked medications
  @Prop({ type: [ConditionMedicationSchema], default: [] })
  medications!: ConditionMedication[];

  // Clinical codes
  @Prop({ required: false })
  icd10Code!: string; // ICD-10 code

  @Prop({ required: false })
  snomedCode!: string; // SNOMED CT code

  // Monitoring
  @Prop({ required: false })
  monitoringRequired!: boolean;

  @Prop({ required: false })
  monitoringFrequency!: string; // e.g., "Monthly", "Quarterly", "Annually"

  @Prop({ type: [String], default: [] })
  complications!: string[]; // List of complications

  @Prop({ type: [String], default: [] })
  riskFactors!: string[]; // Associated risk factors

  // Lifestyle management
  @Prop({ required: false })
  lifestyleRecommendations!: string; // Diet, exercise, etc.

  // Soft delete
  @Prop({ required: false, default: null })
  deletedAt!: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}

export const ChronicConditionSchema = SchemaFactory.createForClass(ChronicCondition);

// Add indexes
ChronicConditionSchema.index({ patientId: 1, status: 1 });
ChronicConditionSchema.index({ patientId: 1, diagnosedDate: -1 });
ChronicConditionSchema.index({ hospitalId: 1, createdAt: -1 });

// Apply soft delete plugin
addSoftDeletePlugin(ChronicConditionSchema);
