import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { addSoftDeletePlugin } from '../../../common/soft-delete.plugin';

export type LabReportDocument = LabReport & MongooseDocument;

/**
 * Test Category - Types of lab tests
 */
export enum TestCategory {
  BLOOD = 'blood',
  URINE = 'urine',
  RADIOLOGY = 'radiology',
  PATHOLOGY = 'pathology',
  MICROBIOLOGY = 'microbiology',
  BIOCHEMISTRY = 'biochemistry',
  HEMATOLOGY = 'hematology',
  IMMUNOLOGY = 'immunology',
  CARDIOLOGY = 'cardiology',
  ENDOCRINOLOGY = 'endocrinology',
  OTHER = 'other',
}

/**
 * Lab Report Status - Lifecycle states
 */
export enum LabReportStatus {
  PENDING = 'pending', // Test ordered but not yet collected
  COLLECTED = 'collected', // Sample collected
  IN_PROGRESS = 'in-progress', // Test is being processed
  COMPLETED = 'completed', // Results are ready
  REVIEWED = 'reviewed', // Doctor has reviewed results
  CANCELLED = 'cancelled', // Test cancelled
}

/**
 * Test Result Status - Indicates if result is normal or abnormal
 */
export enum TestResultStatus {
  NORMAL = 'normal',
  ABNORMAL = 'abnormal',
  CRITICAL = 'critical',
  BORDERLINE = 'borderline',
}

/**
 * Test Parameter Schema - Individual test result within a lab report
 */
@Schema({ _id: false })
export class TestParameter {
  @Prop({ type: String, required: true })
  parameterName!: string;

  @Prop({ type: String, required: true })
  value!: string;

  @Prop({ type: String, required: false })
  unit?: string;

  @Prop({ type: String, required: false })
  normalRange?: string;

  @Prop({
    type: String,
    enum: Object.values(TestResultStatus),
    default: TestResultStatus.NORMAL,
  })
  status!: TestResultStatus;

  @Prop({ type: String, required: false })
  remarks?: string;

  @Prop({ type: String, required: false })
  methodology?: string; // Testing method used
}

export const TestParameterSchema = SchemaFactory.createForClass(TestParameter);

/**
 * Lab Report Schema - FHIR-compliant lab test results
 * Based on FHIR Observation and DiagnosticReport resources
 */
@Schema({
  timestamps: true,
  collection: 'lab-reports',
})
export class LabReport {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  reportId!: string; // Unique identifier (e.g., LAB-2024-001234)

  // Relationships
  @Prop({
    type: String,
    required: true,
    index: true,
    ref: 'Patient',
  })
  patientId!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    index: true,
    ref: 'Doctor',
  })
  doctorId?: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Hospital',
  })
  hospitalId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    ref: 'Hospital',
  })
  labId?: Types.ObjectId; // External lab if different from hospital

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    ref: 'Appointment',
  })
  appointmentId?: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    ref: 'Encounter',
  })
  encounterId?: Types.ObjectId;

  // Test Information
  @Prop({
    type: String,
    enum: Object.values(TestCategory),
    required: true,
    index: true,
  })
  testCategory!: TestCategory;

  @Prop({ type: String, required: true })
  testName!: string; // e.g., "Complete Blood Count (CBC)"

  @Prop({ type: String, required: false })
  testCode?: string; // Standard code (LOINC, SNOMED)

  @Prop({ type: [String], required: false })
  testPanelCodes?: string[]; // For panel tests (multiple codes)

  // Dates
  @Prop({ type: Date, required: true, index: true })
  testDate!: Date; // When test was ordered/collected

  @Prop({ type: Date, required: false })
  sampleCollectionDate?: Date;

  @Prop({ type: Date, required: false, index: true })
  reportDate?: Date; // When results are available

  @Prop({ type: Date, required: false })
  reviewedDate?: Date; // When doctor reviewed the report

  // Status
  @Prop({
    type: String,
    enum: Object.values(LabReportStatus),
    default: LabReportStatus.PENDING,
    index: true,
  })
  status!: LabReportStatus;

  // Test Results
  @Prop({ type: [TestParameterSchema], required: true })
  results!: TestParameter[];

  // Clinical Information
  @Prop({ type: String, required: false })
  clinicalHistory?: string;

  @Prop({ type: String, required: false })
  interpretation?: string; // Overall interpretation by lab

  @Prop({ type: String, required: false })
  recommendations?: string; // Follow-up recommendations

  @Prop({ type: String, required: false })
  diagnosticImpression?: string;

  @Prop({ type: [String], required: false })
  criticalFindings?: string[]; // Critical/urgent findings

  // Lab Personnel
  @Prop({ type: String, required: false })
  verifiedBy?: string; // Lab technician/pathologist name

  @Prop({ type: String, required: false })
  verifiedByLicense?: string;

  @Prop({ type: String, required: false })
  reviewedBy?: string; // Reviewing doctor name

  // File Attachments
  @Prop({ type: String, required: false })
  fileUrl?: string; // PDF report URL

  @Prop({ type: [String], required: false })
  imageUrls?: string[]; // X-rays, scans, etc.

  @Prop({ type: String, required: false })
  digitalSignature?: string; // For authenticity

  // Sample Information
  @Prop({ type: String, required: false })
  sampleType?: string; // e.g., blood, urine, tissue

  @Prop({ type: String, required: false })
  sampleId?: string; // Sample barcode/identifier

  @Prop({ type: String, required: false })
  sampleQuality?: string; // e.g., adequate, inadequate

  // Billing & Insurance
  @Prop({ type: Number, required: false })
  testCost?: number;

  @Prop({ type: Boolean, default: false })
  isPaid!: boolean;

  @Prop({ type: String, required: false })
  invoiceId?: string;

  // Metadata
  @Prop({ type: String, required: false })
  comments?: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  metadata?: Record<string, any>;

  // Notification flags
  @Prop({ type: Boolean, default: false })
  criticalNotificationSent!: boolean;

  @Prop({ type: Boolean, default: false })
  patientNotified!: boolean;

  @Prop({ type: Boolean, default: false })
  doctorNotified!: boolean;

  // Soft delete support
  @Prop({ type: Date, required: false })
  deletedAt?: Date;
}

export const LabReportSchema = SchemaFactory.createForClass(LabReport);

// Apply soft delete plugin
addSoftDeletePlugin(LabReportSchema);

// Indexes for common query patterns
LabReportSchema.index({ createdAt: -1 });
LabReportSchema.index({ patientId: 1, createdAt: -1 });
LabReportSchema.index({ doctorId: 1, createdAt: -1 });
LabReportSchema.index({ hospitalId: 1, createdAt: -1 });
LabReportSchema.index({ status: 1, createdAt: -1 });
LabReportSchema.index({ testCategory: 1, createdAt: -1 });
LabReportSchema.index({ testName: 1 });
LabReportSchema.index({ reportDate: -1 });
LabReportSchema.index({ patientId: 1, testCategory: 1, reportDate: -1 }); // Trend analysis
LabReportSchema.index({ patientId: 1, testName: 1, reportDate: -1 }); // Specific test history

// Text index for searching
LabReportSchema.index({
  testName: 'text',
  interpretation: 'text',
  diagnosticImpression: 'text',
});

// Pre-save hook to generate report ID
LabReportSchema.pre('save', async function (next) {
  if (!this.reportId) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    this.reportId = `LAB-${year}-${random}`;
  }
  next();
});

// Pre-save hook to set report date when status changes to completed
LabReportSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === LabReportStatus.COMPLETED && !this.reportDate) {
    this.reportDate = new Date();
  }
  next();
});

// Virtual for checking if report has critical results
LabReportSchema.virtual('hasCriticalResults').get(function () {
  return this.results.some((result: TestParameter) => result.status === TestResultStatus.CRITICAL);
});

// Virtual for checking if report has abnormal results
LabReportSchema.virtual('hasAbnormalResults').get(function () {
  return this.results.some(
    (result: TestParameter) =>
      result.status === TestResultStatus.ABNORMAL ||
      result.status === TestResultStatus.CRITICAL ||
      result.status === TestResultStatus.BORDERLINE,
  );
});

// Ensure virtuals are included in JSON
LabReportSchema.set('toJSON', { virtuals: true });
LabReportSchema.set('toObject', { virtuals: true });
