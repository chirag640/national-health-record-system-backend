import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';
import { addSoftDeletePlugin } from '../../../common/soft-delete.plugin';

export type VitalSignsDocument = VitalSigns & MongooseDocument;

export enum VitalSignsContext {
  ROUTINE_CHECKUP = 'routine_checkup',
  EMERGENCY = 'emergency',
  PRE_OPERATIVE = 'pre_operative',
  POST_OPERATIVE = 'post_operative',
  ICU_MONITORING = 'icu_monitoring',
  TELEMEDICINE = 'telemedicine',
  HOME_MONITORING = 'home_monitoring',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class VitalSigns extends MongooseDocument {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: false, index: true })
  hospitalId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: false })
  recordedByDoctorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Encounter', required: false })
  encounterId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TelemedicineSession', required: false })
  telemedicineSessionId!: Types.ObjectId;

  // Measurement time
  @Prop({ required: true, index: true })
  recordedAt!: Date;

  @Prop({ type: String, enum: VitalSignsContext, default: VitalSignsContext.ROUTINE_CHECKUP })
  context!: VitalSignsContext;

  // === VITAL SIGNS MEASUREMENTS ===

  // Blood Pressure (mmHg)
  @Prop({ required: false })
  systolicBP!: number; // e.g., 120

  @Prop({ required: false })
  diastolicBP!: number; // e.g., 80

  @Prop({ required: false })
  bpPosition!: string; // e.g., "Sitting", "Standing", "Lying"

  @Prop({ required: false })
  bpArm!: string; // e.g., "Left", "Right"

  // Heart Rate (bpm)
  @Prop({ required: false })
  heartRate!: number; // Beats per minute

  @Prop({ required: false })
  heartRateRhythm!: string; // e.g., "Regular", "Irregular"

  // Respiratory Rate (breaths/min)
  @Prop({ required: false })
  respiratoryRate!: number;

  // Temperature (°C or °F)
  @Prop({ required: false })
  temperature!: number;

  @Prop({ required: false, default: 'celsius' })
  temperatureUnit!: string; // "celsius" or "fahrenheit"

  @Prop({ required: false })
  temperatureRoute!: string; // e.g., "Oral", "Axillary", "Tympanic", "Rectal"

  // Oxygen Saturation (%)
  @Prop({ required: false })
  oxygenSaturation!: number; // SpO2 percentage (0-100)

  @Prop({ required: false })
  onOxygen!: boolean; // Is patient on supplemental oxygen

  @Prop({ required: false })
  oxygenFlowRate!: number; // Liters per minute if on oxygen

  // Height & Weight
  @Prop({ required: false })
  height!: number; // in cm

  @Prop({ required: false })
  weight!: number; // in kg

  @Prop({ required: false })
  bmi!: number; // Body Mass Index (calculated)

  // Additional measurements
  @Prop({ required: false })
  headCircumference!: number; // in cm (for pediatrics)

  @Prop({ required: false })
  waistCircumference!: number; // in cm

  @Prop({ required: false })
  hipCircumference!: number; // in cm

  @Prop({ required: false })
  waistHipRatio!: number; // Calculated

  // Pain assessment
  @Prop({ required: false, min: 0, max: 10 })
  painScore!: number; // 0-10 scale

  @Prop({ required: false })
  painLocation!: string;

  // Blood Glucose (for diabetic patients)
  @Prop({ required: false })
  bloodGlucose!: number; // mg/dL

  @Prop({ required: false })
  glucoseMeasurementType!: string; // e.g., "Fasting", "Random", "Post-prandial"

  // Peak Flow (for asthma/COPD patients)
  @Prop({ required: false })
  peakExpiratoryFlow!: number; // L/min

  // Additional notes
  @Prop({ required: false })
  notes!: string;

  @Prop({ required: false })
  recordedBy!: string; // Name of person who recorded (nurse, doctor, etc.)

  // Flags for abnormal values
  @Prop({ default: false })
  hasAbnormalValues!: boolean;

  @Prop({ type: [String], default: [] })
  abnormalFlags!: string[]; // e.g., ["High BP", "Low SpO2"]

  // Clinical significance
  @Prop({ required: false })
  clinicalInterpretation!: string; // Doctor's interpretation

  @Prop({ required: false })
  actionTaken!: string; // Any immediate action taken

  // Soft delete
  @Prop({ required: false, default: null })
  deletedAt!: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}

export const VitalSignsSchema = SchemaFactory.createForClass(VitalSigns);

// Add indexes
VitalSignsSchema.index({ patientId: 1, recordedAt: -1 });
VitalSignsSchema.index({ patientId: 1, context: 1 });
VitalSignsSchema.index({ encounterId: 1 });
VitalSignsSchema.index({ hospitalId: 1, recordedAt: -1 });
VitalSignsSchema.index({ hasAbnormalValues: 1, recordedAt: -1 });

// Pre-save middleware to calculate BMI
VitalSignsSchema.pre('save', function (next) {
  if (this.height && this.weight) {
    const heightInMeters = this.height / 100;
    this.bmi = Math.round((this.weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }

  if (this.waistCircumference && this.hipCircumference) {
    this.waistHipRatio = Math.round((this.waistCircumference / this.hipCircumference) * 100) / 100;
  }

  // Check for abnormal values
  const abnormal: string[] = [];

  // Blood Pressure
  if (this.systolicBP && this.diastolicBP) {
    if (this.systolicBP > 140 || this.diastolicBP > 90) {
      abnormal.push('High Blood Pressure');
    } else if (this.systolicBP < 90 || this.diastolicBP < 60) {
      abnormal.push('Low Blood Pressure');
    }
  }

  // Heart Rate
  if (this.heartRate) {
    if (this.heartRate > 100) {
      abnormal.push('Tachycardia');
    } else if (this.heartRate < 60) {
      abnormal.push('Bradycardia');
    }
  }

  // Oxygen Saturation
  if (this.oxygenSaturation && this.oxygenSaturation < 95) {
    abnormal.push('Low Oxygen Saturation');
  }

  // Temperature (assuming Celsius)
  if (this.temperature && this.temperatureUnit === 'celsius') {
    if (this.temperature > 37.5) {
      abnormal.push('Fever');
    } else if (this.temperature < 35) {
      abnormal.push('Hypothermia');
    }
  }

  // BMI
  if (this.bmi) {
    if (this.bmi > 30) {
      abnormal.push('Obese');
    } else if (this.bmi < 18.5) {
      abnormal.push('Underweight');
    }
  }

  this.hasAbnormalValues = abnormal.length > 0;
  this.abnormalFlags = abnormal;

  next();
});

// Apply soft delete plugin
addSoftDeletePlugin(VitalSignsSchema);
