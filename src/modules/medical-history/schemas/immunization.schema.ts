import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';
import { addSoftDeletePlugin } from '../../../common/soft-delete.plugin';

export type ImmunizationDocument = Immunization & MongooseDocument;

export enum ImmunizationStatus {
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered_in_error',
  NOT_DONE = 'not_done',
}

export enum ImmunizationRouteOfAdministration {
  INTRAMUSCULAR = 'intramuscular',
  SUBCUTANEOUS = 'subcutaneous',
  ORAL = 'oral',
  INTRANASAL = 'intranasal',
  INTRADERMAL = 'intradermal',
  OTHER = 'other',
}

@Schema({ _id: false })
export class VaccineDose {
  @Prop({ required: true })
  doseNumber!: number; // e.g., 1, 2, 3

  @Prop({ required: true })
  administeredDate!: Date;

  @Prop({ required: false })
  expirationDate!: Date;

  @Prop({ required: false })
  lotNumber!: string; // Vaccine lot/batch number

  @Prop({ required: false })
  manufacturer!: string;

  @Prop({ required: false })
  site!: string; // Injection site (e.g., "Left arm", "Right thigh")

  @Prop({ type: String, enum: ImmunizationRouteOfAdministration })
  route!: ImmunizationRouteOfAdministration;

  @Prop({ required: false })
  administeredBy!: string; // Healthcare provider name

  @Prop({ type: [String], default: [] })
  adverseReactions!: string[]; // Any adverse reactions observed
}

export const VaccineDoseSchema = SchemaFactory.createForClass(VaccineDose);

@Schema({ timestamps: true })
export class Immunization extends MongooseDocument {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: false, index: true })
  hospitalId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: false })
  prescribedByDoctorId!: Types.ObjectId;

  // Vaccine details
  @Prop({ required: true })
  vaccineName!: string; // e.g., "COVID-19 Vaccine", "MMR", "Hepatitis B"

  @Prop({ required: false })
  vaccineCode!: string; // CVX code or other vaccine code

  @Prop({ type: String, enum: ImmunizationStatus, default: ImmunizationStatus.COMPLETED })
  status!: ImmunizationStatus;

  @Prop({ required: false })
  targetDisease!: string; // Disease prevented by vaccine

  // Dose tracking
  @Prop({ type: [VaccineDoseSchema], default: [] })
  doses!: VaccineDose[];

  @Prop({ required: false })
  totalDosesRequired!: number; // Total number of doses in series

  @Prop({ required: false })
  isSeriesComplete!: boolean;

  @Prop({ required: false })
  nextDueDate!: Date; // When next dose is due

  // Funding source
  @Prop({ required: false })
  fundingSource!: string; // e.g., "Government program", "Private", "Insurance"

  // Education
  @Prop({ required: false })
  educationProvided!: boolean; // Was education about vaccine provided

  @Prop({ required: false })
  consentObtained!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Consent', required: false })
  consentId!: Types.ObjectId;

  // Additional information
  @Prop({ required: false })
  notes!: string;

  @Prop({ required: false })
  reasonNotGiven!: string; // If status is NOT_DONE, reason why

  // Clinical codes
  @Prop({ required: false })
  snomedCode!: string;

  @Prop({ required: false })
  loincCode!: string; // LOINC code for observation

  // Reminder tracking
  @Prop({ required: false })
  reminderSent!: boolean;

  @Prop({ required: false })
  reminderDate!: Date;

  // Soft delete
  @Prop({ required: false, default: null })
  deletedAt!: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}

export const ImmunizationSchema = SchemaFactory.createForClass(Immunization);

// Add indexes
ImmunizationSchema.index({ patientId: 1, vaccineName: 1 });
ImmunizationSchema.index({ patientId: 1, status: 1 });
ImmunizationSchema.index({ patientId: 1, nextDueDate: 1 });
ImmunizationSchema.index({ hospitalId: 1, createdAt: -1 });

// Apply soft delete plugin
addSoftDeletePlugin(ImmunizationSchema);
