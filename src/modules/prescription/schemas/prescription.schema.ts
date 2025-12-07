import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { addSoftDeletePlugin } from '../../../common/soft-delete.plugin';

export type PrescriptionDocument = Prescription & MongooseDocument;

/**
 * FHIR-compliant MedicationRequest statuses
 * Based on: https://build.fhir.org/valueset-medicationrequest-status.html
 */
export enum PrescriptionStatus {
  ACTIVE = 'active', // Prescription is active and can be dispensed
  ON_HOLD = 'on-hold', // Temporarily suspended
  CANCELLED = 'cancelled', // Prescription cancelled
  COMPLETED = 'completed', // All dispenses completed
  ENTERED_IN_ERROR = 'entered-in-error', // Created by mistake
  STOPPED = 'stopped', // Stopped by prescriber
  DRAFT = 'draft', // Not yet finalized
  UNKNOWN = 'unknown', // Status unclear
}

/**
 * FHIR-compliant intent codes
 */
export enum PrescriptionIntent {
  PROPOSAL = 'proposal', // Suggesting treatment
  PLAN = 'plan', // Planned prescription
  ORDER = 'order', // Actual prescription order
  ORIGINAL_ORDER = 'original-order', // Original order
  REFLEX_ORDER = 'reflex-order', // Conditional order
  FILLER_ORDER = 'filler-order', // Order from dispenser
  INSTANCE_ORDER = 'instance-order', // Single instance
  OPTION = 'option', // Optional order
}

/**
 * Priority levels for prescription
 */
export enum PrescriptionPriority {
  ROUTINE = 'routine', // Normal priority
  URGENT = 'urgent', // Urgent but not emergency
  ASAP = 'asap', // As soon as possible
  STAT = 'stat', // Immediately
}

/**
 * Course of therapy type
 */
export enum CourseOfTherapy {
  ACUTE = 'acute', // Short term treatment
  CHRONIC = 'chronic', // Long term/ongoing
  SEASONAL = 'seasonal', // Seasonal treatment
  CONTINUOUS = 'continuous', // Continuous treatment
}

/**
 * Dosage timing codes
 */
export enum DosageTimingCode {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night',
  BEFORE_MEAL = 'before-meal',
  AFTER_MEAL = 'after-meal',
  WITH_MEAL = 'with-meal',
  EMPTY_STOMACH = 'empty-stomach',
  BEDTIME = 'bedtime',
}

/**
 * Route of administration
 */
export enum RouteOfAdministration {
  ORAL = 'oral',
  SUBLINGUAL = 'sublingual',
  TOPICAL = 'topical',
  INTRAVENOUS = 'intravenous',
  INTRAMUSCULAR = 'intramuscular',
  SUBCUTANEOUS = 'subcutaneous',
  INHALATION = 'inhalation',
  NASAL = 'nasal',
  RECTAL = 'rectal',
  OPHTHALMIC = 'ophthalmic',
  OTIC = 'otic',
  TRANSDERMAL = 'transdermal',
}

/**
 * Dosage instruction structure
 */
@Schema({ _id: false })
export class DosageInstruction {
  @Prop({ required: true })
  sequence!: number; // Order of instruction

  @Prop({ required: true })
  text!: string; // Free text instructions (e.g., "Take 1 tablet twice daily")

  @Prop()
  patientInstruction?: string; // Additional patient-friendly instructions

  @Prop({ type: String, enum: Object.values(DosageTimingCode) })
  timing?: DosageTimingCode; // When to take

  @Prop()
  asNeededBoolean?: boolean; // PRN (as needed) flag

  @Prop()
  asNeededFor?: string; // Reason for PRN use (e.g., "for pain")

  @Prop({ type: String, enum: Object.values(RouteOfAdministration), required: true })
  route!: RouteOfAdministration;

  @Prop()
  method?: string; // Technique for administration (e.g., "swallow whole")

  // Dose quantity
  @Prop({ required: true })
  doseQuantityValue!: number; // Amount (e.g., 500)

  @Prop({ required: true })
  doseQuantityUnit!: string; // Unit (e.g., "mg", "ml", "tablet")

  @Prop()
  doseQuantityCode?: string; // UCUM code for unit

  // Rate (for IV, infusions)
  @Prop()
  rateQuantityValue?: number;

  @Prop()
  rateQuantityUnit?: string;

  // Max dose per period
  @Prop()
  maxDosePerPeriod?: number;

  @Prop()
  maxDosePerPeriodUnit?: string; // "day", "week", etc.

  // Duration
  @Prop()
  durationValue?: number;

  @Prop()
  durationUnit?: string; // "day", "week", "month"

  // Frequency
  @Prop()
  frequencyValue?: number; // How many times

  @Prop()
  frequencyPeriod?: number; // Per how long

  @Prop()
  frequencyPeriodUnit?: string; // "day", "hour", "week"
}

export const DosageInstructionSchema = SchemaFactory.createForClass(DosageInstruction);

/**
 * Dispense request details
 */
@Schema({ _id: false })
export class DispenseRequest {
  @Prop()
  validityPeriodStart?: Date; // When prescription becomes valid

  @Prop()
  validityPeriodEnd?: Date; // When prescription expires

  @Prop({ default: 0 })
  numberOfRepeatsAllowed!: number; // Number of refills

  @Prop()
  quantityValue?: number; // Total amount to dispense

  @Prop()
  quantityUnit?: string; // Unit of quantity

  @Prop()
  expectedSupplyDurationValue?: number; // How many days supply

  @Prop()
  expectedSupplyDurationUnit?: string; // "day", "week"

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital' })
  dispenser?: Types.ObjectId; // Preferred pharmacy/dispenser

  @Prop()
  dispenserInstructions?: string; // Special instructions for pharmacist
}

export const DispenseRequestSchema = SchemaFactory.createForClass(DispenseRequest);

/**
 * Substitution allowance
 */
@Schema({ _id: false })
export class SubstitutionAllowance {
  @Prop({ required: true })
  allowed!: boolean; // Can generic be substituted?

  @Prop()
  reason?: string; // Reason for allowing/not allowing
}

export const SubstitutionAllowanceSchema = SchemaFactory.createForClass(SubstitutionAllowance);

/**
 * Main Prescription Schema
 * Based on FHIR MedicationRequest resource
 */
@Schema({
  timestamps: true,
  collection: 'prescriptions',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Prescription {
  @Prop({ required: true, unique: true })
  prescriptionNumber!: string; // Unique prescription identifier (e.g., RX-2024-001234)

  @Prop({
    type: String,
    enum: Object.values(PrescriptionStatus),
    default: PrescriptionStatus.ACTIVE,
  })
  status!: PrescriptionStatus;

  @Prop()
  statusReason?: string; // Reason for current status

  @Prop({ type: Date })
  statusChanged?: Date; // When status last changed

  @Prop({
    type: String,
    enum: Object.values(PrescriptionIntent),
    default: PrescriptionIntent.ORDER,
  })
  intent!: PrescriptionIntent;

  @Prop({
    type: String,
    enum: Object.values(PrescriptionPriority),
    default: PrescriptionPriority.ROUTINE,
  })
  priority!: PrescriptionPriority;

  // Patient reference (using guid for ABDM compliance)
  @Prop({ required: true, index: true })
  patientGuid!: string; // ABDM patient GUID

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true, index: true })
  patient!: Types.ObjectId;

  // Prescriber (Doctor)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Doctor', required: true, index: true })
  prescriber!: Types.ObjectId;

  @Prop()
  prescriberName?: string; // Cache for display

  @Prop()
  prescriberLicenseNumber?: string; // Medical council registration number

  // Hospital/Organization
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital', index: true })
  organization?: Types.ObjectId;

  // Related encounter
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Encounter', index: true })
  encounter?: Types.ObjectId;

  // Medication details
  @Prop({ required: true })
  medicationName!: string; // Brand or generic name

  @Prop()
  medicationCode?: string; // Standard code (SNOMED, RxNorm, etc.)

  @Prop()
  medicationCodeSystem?: string; // Which coding system

  @Prop()
  genericName?: string; // Generic/scientific name

  @Prop()
  manufacturer?: string; // Manufacturer name

  @Prop()
  form?: string; // Dosage form (tablet, capsule, syrup, injection)

  @Prop()
  strength?: string; // Strength (e.g., "500mg", "5mg/ml")

  // Dosage instructions (can have multiple for complex regimens)
  @Prop({ type: [DosageInstructionSchema], required: true })
  dosageInstruction!: DosageInstruction[];

  @Prop()
  additionalInstructions?: string; // Any extra instructions

  // Course of therapy
  @Prop({ type: String, enum: Object.values(CourseOfTherapy) })
  courseOfTherapy?: CourseOfTherapy;

  // Reason for prescription
  @Prop()
  reasonCode?: string; // Diagnosis/condition code

  @Prop()
  reasonText?: string; // Plain text reason

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'HealthDocument' })
  reasonReference?: Types.ObjectId[]; // Reference to diagnosis

  // Dates
  @Prop({ required: true, index: true })
  authoredOn!: Date; // When prescription was written

  @Prop()
  effectivePeriodStart?: Date; // When to start medication

  @Prop()
  effectivePeriodEnd?: Date; // When to stop medication

  // Dispense details
  @Prop({ type: DispenseRequestSchema })
  dispenseRequest?: DispenseRequest;

  // Substitution
  @Prop({ type: SubstitutionAllowanceSchema })
  substitution?: SubstitutionAllowance;

  // Prior prescription (for refills/renewals)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Prescription' })
  priorPrescription?: Types.ObjectId;

  // Warnings and interactions
  @Prop({ type: [String] })
  warnings?: string[]; // Drug warnings

  @Prop({ type: [String] })
  interactions?: string[]; // Known drug interactions

  @Prop({ type: [String] })
  allergiesConsidered?: string[]; // Patient allergies checked

  // Digital signature (for e-prescription)
  @Prop()
  digitalSignature?: string; // Encrypted signature

  @Prop()
  signatureTimestamp?: Date;

  // Notes and instructions
  @Prop()
  pharmacistNotes?: string; // Notes for pharmacist

  @Prop()
  patientNotes?: string; // Notes for patient

  @Prop({ type: [String] })
  tags?: string[]; // For categorization

  // Compliance and tracking
  @Prop({ default: false })
  isControlledSubstance!: boolean; // Narcotic/controlled drug

  @Prop()
  controlledSubstanceSchedule?: string; // Schedule I-V

  @Prop({ default: false })
  requiresPreauthorization!: boolean; // Insurance preauth needed

  @Prop()
  preauthorizationNumber?: string;

  // Dispensing tracking
  @Prop({ default: 0 })
  dispensedCount!: number; // How many times dispensed

  @Prop()
  lastDispensedDate?: Date;

  // Metadata
  @Prop({ type: Map, of: MongooseSchema.Types.Mixed })
  metadata?: Map<string, any>;

  // For notification/follow-up
  @Prop()
  reminderEnabled?: boolean;

  @Prop()
  nextReminderDate?: Date;
}

export const PrescriptionSchema = SchemaFactory.createForClass(Prescription);

// Apply soft delete plugin
addSoftDeletePlugin(PrescriptionSchema);

// Indexes for performance
PrescriptionSchema.index({ patientGuid: 1, status: 1 });
PrescriptionSchema.index({ patient: 1, authoredOn: -1 });
PrescriptionSchema.index({ prescriber: 1, authoredOn: -1 });
PrescriptionSchema.index({ encounter: 1 });
PrescriptionSchema.index({ status: 1, authoredOn: -1 });
PrescriptionSchema.index({ prescriptionNumber: 1 }, { unique: true });
PrescriptionSchema.index({ 'dispenseRequest.validityPeriodEnd': 1 }); // For expiry checks
PrescriptionSchema.index({ medicationName: 'text', genericName: 'text' }); // Text search

// Virtual for checking if prescription is expired
PrescriptionSchema.virtual('isExpired').get(function () {
  if (!this.dispenseRequest?.validityPeriodEnd) return false;
  return new Date() > this.dispenseRequest.validityPeriodEnd;
});

// Virtual for checking if refills available
PrescriptionSchema.virtual('refillsRemaining').get(function () {
  if (!this.dispenseRequest) return 0;
  return Math.max(0, (this.dispenseRequest.numberOfRepeatsAllowed || 0) - this.dispensedCount);
});
