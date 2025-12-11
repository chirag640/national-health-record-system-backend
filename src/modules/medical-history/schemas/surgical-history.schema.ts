import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';
import { addSoftDeletePlugin } from '../../../common/soft-delete.plugin';

export type SurgicalHistoryDocument = SurgicalHistory & MongooseDocument;

export enum SurgeryType {
  MAJOR = 'major',
  MINOR = 'minor',
  EMERGENCY = 'emergency',
  ELECTIVE = 'elective',
}

export enum SurgeryOutcome {
  SUCCESSFUL = 'successful',
  COMPLICATED = 'complicated',
  FAILED = 'failed',
  PARTIAL_SUCCESS = 'partial_success',
}

@Schema({ _id: false })
export class SurgeryComplication {
  @Prop({ required: true })
  complication!: string;

  @Prop({ required: false })
  severity!: string;

  @Prop({ required: false })
  resolved!: boolean;

  @Prop({ required: false })
  treatmentProvided!: string;
}

export const SurgeryComplicationSchema = SchemaFactory.createForClass(SurgeryComplication);

@Schema({ timestamps: true })
export class SurgicalHistory extends MongooseDocument {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: false, index: true })
  hospitalId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: false })
  surgeonId!: Types.ObjectId;

  // Surgery details
  @Prop({ required: true })
  surgeryName!: string; // e.g., "Appendectomy", "Coronary Artery Bypass"

  @Prop({ required: true })
  surgeryDate!: Date;

  @Prop({ type: String, enum: SurgeryType, required: true })
  surgeryType!: SurgeryType;

  @Prop({ required: false })
  indication!: string; // Reason for surgery

  @Prop({ required: false })
  procedure!: string; // Detailed procedure description

  // Surgical team
  @Prop({ required: false })
  surgeonName!: string;

  @Prop({ required: false })
  anesthesiologist!: string;

  @Prop({ required: false })
  assistingSurgeons!: string[];

  // Procedure details
  @Prop({ required: false })
  anesthesiaType!: string; // e.g., "General", "Local", "Spinal"

  @Prop({ required: false })
  durationMinutes!: number; // Surgery duration

  @Prop({ required: false })
  bloodLoss!: number; // in ml

  @Prop({ required: false })
  transfusionRequired!: boolean;

  // Outcome
  @Prop({ type: String, enum: SurgeryOutcome, default: SurgeryOutcome.SUCCESSFUL })
  outcome!: SurgeryOutcome;

  @Prop({ type: [SurgeryComplicationSchema], default: [] })
  complications!: SurgeryComplication[];

  // Recovery
  @Prop({ required: false })
  hospitalStayDays!: number;

  @Prop({ required: false })
  dischargeDate!: Date;

  @Prop({ required: false })
  recoveryNotes!: string;

  @Prop({ required: false })
  followUpRequired!: boolean;

  @Prop({ required: false })
  followUpDate!: Date;

  // Clinical codes
  @Prop({ required: false })
  cptCode!: string; // Current Procedural Terminology code

  @Prop({ required: false })
  icd10ProcedureCode!: string;

  // Pathology
  @Prop({ required: false })
  pathologyReport!: string; // Link to pathology report or summary

  @Prop({ required: false })
  implants!: string[]; // List of implants used

  // Additional notes
  @Prop({ required: false })
  notes!: string;

  // Soft delete
  @Prop({ required: false, default: null })
  deletedAt!: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}

export const SurgicalHistorySchema = SchemaFactory.createForClass(SurgicalHistory);

// Add indexes
SurgicalHistorySchema.index({ patientId: 1, surgeryDate: -1 });
SurgicalHistorySchema.index({ patientId: 1, surgeryType: 1 });
SurgicalHistorySchema.index({ hospitalId: 1, surgeryDate: -1 });

// Apply soft delete plugin
addSoftDeletePlugin(SurgicalHistorySchema);
