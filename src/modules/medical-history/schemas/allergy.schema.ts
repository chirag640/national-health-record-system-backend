import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';
import { addSoftDeletePlugin } from '../../../common/soft-delete.plugin';

export type AllergyDocument = Allergy & MongooseDocument;

export enum AllergyType {
  FOOD = 'food',
  MEDICATION = 'medication',
  ENVIRONMENTAL = 'environmental',
  INSECT = 'insect',
  LATEX = 'latex',
  OTHER = 'other',
}

export enum AllergySeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  LIFE_THREATENING = 'life_threatening',
}

export enum AllergyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RESOLVED = 'resolved',
  SUSPECTED = 'suspected',
}

@Schema({ _id: false })
export class AllergyReaction {
  @Prop({ required: true })
  symptom!: string; // e.g., "Hives", "Swelling", "Anaphylaxis"

  @Prop({ required: false })
  severity!: string; // Severity of this specific symptom

  @Prop({ required: false })
  onset!: string; // e.g., "Immediate", "Within hours"
}

export const AllergyReactionSchema = SchemaFactory.createForClass(AllergyReaction);

@Schema({ timestamps: true })
export class Allergy extends MongooseDocument {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: false, index: true })
  hospitalId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: false })
  reportedByDoctorId!: Types.ObjectId;

  // Allergy details
  @Prop({ required: true })
  allergen!: string; // Name of the allergen (e.g., "Penicillin", "Peanuts", "Pollen")

  @Prop({ type: String, enum: AllergyType, required: true })
  type!: AllergyType;

  @Prop({ type: String, enum: AllergySeverity, required: true })
  severity!: AllergySeverity;

  @Prop({ type: String, enum: AllergyStatus, default: AllergyStatus.ACTIVE })
  status!: AllergyStatus;

  // Reactions
  @Prop({ type: [AllergyReactionSchema], default: [] })
  reactions!: AllergyReaction[];

  // Clinical information
  @Prop({ required: false })
  diagnosedDate!: Date; // When the allergy was first diagnosed

  @Prop({ required: false })
  lastReactionDate!: Date; // Date of most recent allergic reaction

  @Prop({ required: false })
  notes!: string; // Additional notes about the allergy

  @Prop({ required: false })
  verificationStatus!: string; // e.g., "Confirmed", "Self-reported", "Suspected"

  // Related clinical codes
  @Prop({ required: false })
  snomedCode!: string; // SNOMED CT code for standardization

  @Prop({ required: false })
  icd10Code!: string; // ICD-10 code

  // Soft delete
  @Prop({ required: false, default: null })
  deletedAt!: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}

export const AllergySchema = SchemaFactory.createForClass(Allergy);

// Add indexes
AllergySchema.index({ patientId: 1, status: 1 });
AllergySchema.index({ patientId: 1, type: 1 });
AllergySchema.index({ patientId: 1, severity: 1 });
AllergySchema.index({ hospitalId: 1, createdAt: -1 });

// Apply soft delete plugin
addSoftDeletePlugin(AllergySchema);
