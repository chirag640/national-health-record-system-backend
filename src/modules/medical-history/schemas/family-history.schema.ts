import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';
import { addSoftDeletePlugin } from '../../../common/soft-delete.plugin';

export type FamilyHistoryDocument = FamilyHistory & MongooseDocument;

export enum FamilyRelationship {
  FATHER = 'father',
  MOTHER = 'mother',
  BROTHER = 'brother',
  SISTER = 'sister',
  SON = 'son',
  DAUGHTER = 'daughter',
  GRANDFATHER_PATERNAL = 'grandfather_paternal',
  GRANDMOTHER_PATERNAL = 'grandmother_paternal',
  GRANDFATHER_MATERNAL = 'grandfather_maternal',
  GRANDMOTHER_MATERNAL = 'grandmother_maternal',
  UNCLE = 'uncle',
  AUNT = 'aunt',
  COUSIN = 'cousin',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class FamilyHistory extends MongooseDocument {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: false, index: true })
  hospitalId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: false })
  recordedByDoctorId!: Types.ObjectId;

  // Family member details
  @Prop({ type: String, enum: FamilyRelationship, required: true })
  relationship!: FamilyRelationship;

  @Prop({ required: false })
  relativeName!: string; // Optional name of the family member

  @Prop({ required: false })
  relativeAge!: number; // Current age or age at death

  @Prop({ required: false })
  isAlive!: boolean;

  @Prop({ required: false })
  ageAtDeath!: number;

  @Prop({ required: false })
  causeOfDeath!: string;

  // Medical condition
  @Prop({ required: true })
  condition!: string; // e.g., "Diabetes", "Heart Disease", "Cancer"

  @Prop({ required: false })
  conditionDetails!: string; // Additional details about the condition

  @Prop({ required: false })
  diagnosisAge!: number; // Age when diagnosed

  @Prop({ required: false })
  icd10Code!: string; // ICD-10 code for the condition

  @Prop({ required: false })
  snomedCode!: string; // SNOMED CT code

  // Risk assessment
  @Prop({ required: false })
  inheritancePattern!: string; // e.g., "Autosomal dominant", "X-linked", "Multifactorial"

  @Prop({ required: false })
  patientRiskLevel!: string; // e.g., "Low", "Moderate", "High"

  @Prop({ required: false })
  screeningRecommendations!: string; // Recommended screenings for patient

  // Additional information
  @Prop({ required: false })
  notes!: string;

  @Prop({ required: false })
  verificationStatus!: string; // e.g., "Confirmed", "Self-reported", "Suspected"

  // Soft delete
  @Prop({ required: false, default: null })
  deletedAt!: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}

export const FamilyHistorySchema = SchemaFactory.createForClass(FamilyHistory);

// Add indexes
FamilyHistorySchema.index({ patientId: 1, relationship: 1 });
FamilyHistorySchema.index({ patientId: 1, condition: 1 });
FamilyHistorySchema.index({ hospitalId: 1, createdAt: -1 });

// Apply soft delete plugin
addSoftDeletePlugin(FamilyHistorySchema);
