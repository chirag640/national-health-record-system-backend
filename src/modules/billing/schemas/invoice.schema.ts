import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { addSoftDeletePlugin } from '../../../common/soft-delete.plugin';

export type InvoiceDocument = Invoice & Document;

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially-paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
  NET_BANKING = 'net-banking',
  WALLET = 'wallet',
  INSURANCE = 'insurance',
  CREDIT = 'credit',
}

export enum ServiceType {
  CONSULTATION = 'consultation',
  PROCEDURE = 'procedure',
  LAB_TEST = 'lab-test',
  RADIOLOGY = 'radiology',
  PHARMACY = 'pharmacy',
  SURGERY = 'surgery',
  ROOM_CHARGES = 'room-charges',
  ICU_CHARGES = 'icu-charges',
  TELEMEDICINE = 'telemedicine',
  OTHER = 'other',
}

@Schema({ _id: false })
export class InvoiceItem {
  @Prop({ required: true })
  itemId!: string;

  @Prop({ required: true, enum: Object.values(ServiceType) })
  serviceType!: ServiceType;

  @Prop({ required: true })
  description!: string;

  @Prop()
  code?: string; // CPT/HCPCS code for procedures

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  unitPrice!: number;

  @Prop({ min: 0, max: 100, default: 0 })
  discountPercent?: number;

  @Prop({ min: 0, default: 0 })
  discountAmount?: number;

  @Prop({ min: 0, max: 100, default: 0 })
  taxPercent?: number;

  @Prop({ min: 0, default: 0 })
  taxAmount?: number;

  @Prop({ required: true, min: 0 })
  totalAmount!: number;

  @Prop()
  notes?: string;
}

const InvoiceItemSchema = SchemaFactory.createForClass(InvoiceItem);

@Schema({ _id: false })
export class InsuranceClaim {
  @Prop({ required: true })
  insuranceProvider!: string;

  @Prop({ required: true })
  policyNumber!: string;

  @Prop()
  claimNumber?: string;

  @Prop({ required: true, min: 0 })
  claimAmount!: number;

  @Prop({ min: 0, default: 0 })
  approvedAmount?: number;

  @Prop({ default: 'pending' })
  status!: string; // pending, approved, rejected, processing

  @Prop()
  submittedAt?: Date;

  @Prop()
  approvedAt?: Date;

  @Prop()
  rejectionReason?: string;

  @Prop({ type: [String], default: [] })
  documents!: string[]; // S3 URLs

  @Prop()
  notes?: string;
}

const InsuranceClaimSchema = SchemaFactory.createForClass(InsuranceClaim);

@Schema({ _id: false })
export class PaymentRecord {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Payment' })
  paymentId!: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ required: true, enum: Object.values(PaymentMethod) })
  method!: PaymentMethod;

  @Prop({ required: true })
  paidAt!: Date;

  @Prop()
  transactionId?: string;

  @Prop()
  notes?: string;
}

const PaymentRecordSchema = SchemaFactory.createForClass(PaymentRecord);

@Schema({ timestamps: true })
export class Invoice {
  @Prop()
  invoiceNumber?: string; // AUTO: INV-2024-NNNNNN

  @Prop({ required: true, enum: Object.values(InvoiceStatus), default: InvoiceStatus.DRAFT })
  status!: InvoiceStatus;

  // Related Entities
  @Prop({ required: true })
  patientId!: string; // Patient GUID

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Doctor' })
  doctorId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'Hospital' })
  hospitalId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Appointment' })
  appointmentId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Encounter' })
  encounterId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TelemedicineSession' })
  telemedicineSessionId?: Types.ObjectId;

  // Invoice Details
  @Prop({ required: true })
  invoiceDate!: Date;

  @Prop({ required: true })
  dueDate!: Date;

  @Prop({ type: [InvoiceItemSchema], required: true })
  items!: InvoiceItem[];

  // Amounts
  @Prop({ required: true, min: 0 })
  subtotal!: number;

  @Prop({ min: 0, default: 0 })
  totalDiscount!: number;

  @Prop({ min: 0, default: 0 })
  totalTax!: number;

  @Prop({ required: true, min: 0 })
  totalAmount!: number;

  @Prop({ min: 0, default: 0 })
  paidAmount!: number;

  @Prop({ min: 0, default: 0 })
  balanceAmount!: number;

  // Payment Details
  @Prop({ type: [PaymentRecordSchema], default: [] })
  payments!: PaymentRecord[];

  @Prop({ default: 'INR' })
  currency!: string;

  // Insurance
  @Prop({ type: InsuranceClaimSchema })
  insuranceClaim?: InsuranceClaim;

  // Patient/Billing Information
  @Prop({ required: true })
  patientName!: string;

  @Prop()
  patientEmail?: string;

  @Prop()
  patientPhone?: string;

  @Prop()
  patientAddress?: string;

  @Prop()
  patientGSTIN?: string; // For Indian businesses

  // Hospital/Facility Information
  @Prop({ required: true })
  hospitalName!: string;

  @Prop()
  hospitalAddress?: string;

  @Prop()
  hospitalGSTIN?: string;

  @Prop()
  hospitalPAN?: string;

  // Additional Details
  @Prop()
  notes?: string;

  @Prop()
  termsAndConditions?: string;

  @Prop({ type: [String], default: [] })
  attachments!: string[]; // S3 URLs for supporting documents

  // Cancellation/Refund
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;

  @Prop()
  cancellationReason?: string;

  @Prop()
  cancelledAt?: Date;

  @Prop({ min: 0, default: 0 })
  refundAmount?: number;

  @Prop()
  refundedAt?: Date;

  @Prop()
  refundTransactionId?: string;

  // Notifications
  @Prop({ default: false })
  paymentReminderSent?: boolean;

  @Prop()
  lastReminderSentAt?: Date;

  @Prop({ default: 0 })
  reminderCount?: number;

  // Metadata
  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  // Soft Delete
  @Prop()
  deletedAt?: Date;

  // Timestamps
  createdAt!: Date;
  updatedAt!: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// Apply soft delete plugin
addSoftDeletePlugin(InvoiceSchema);

// Indexes for performance
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ patientId: 1, status: 1 });
InvoiceSchema.index({ hospitalId: 1, status: 1 });
InvoiceSchema.index({ doctorId: 1, status: 1 });
InvoiceSchema.index({ appointmentId: 1 });
InvoiceSchema.index({ encounterId: 1 });
InvoiceSchema.index({ telemedicineSessionId: 1 });
InvoiceSchema.index({ status: 1, dueDate: 1 });
InvoiceSchema.index({ invoiceDate: -1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ 'insuranceClaim.claimNumber': 1 });
InvoiceSchema.index({ deletedAt: 1 });
InvoiceSchema.index({ createdAt: -1 });

// Pre-save middleware to generate invoice number
InvoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber && this.status !== InvoiceStatus.DRAFT) {
    const year = new Date().getFullYear();
    const count = await (this.constructor as any).countDocuments();
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate balance amount
  this.balanceAmount = this.totalAmount - this.paidAmount;

  // Update status based on payment
  if (this.paidAmount >= this.totalAmount && this.status !== InvoiceStatus.REFUNDED) {
    this.status = InvoiceStatus.PAID;
  } else if (this.paidAmount > 0 && this.paidAmount < this.totalAmount) {
    this.status = InvoiceStatus.PARTIALLY_PAID;
  } else if (this.status === InvoiceStatus.PENDING && new Date() > this.dueDate) {
    this.status = InvoiceStatus.OVERDUE;
  }

  next();
});

// Virtual for is overdue
InvoiceSchema.virtual('isOverdue').get(function () {
  return this.status === InvoiceStatus.PENDING && new Date() > this.dueDate;
});

// Virtual for days overdue
InvoiceSchema.virtual('daysOverdue').get(function () {
  const isOverdue = this.status === InvoiceStatus.PENDING && new Date() > this.dueDate;
  if (this.status !== InvoiceStatus.OVERDUE && !isOverdue) {
    return 0;
  }
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - this.dueDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for payment completion percentage
InvoiceSchema.virtual('paymentPercentage').get(function () {
  if (this.totalAmount === 0) {
    return 0;
  }
  return Math.round((this.paidAmount / this.totalAmount) * 100);
});

// Ensure virtuals are included in JSON
InvoiceSchema.set('toJSON', { virtuals: true });
InvoiceSchema.set('toObject', { virtuals: true });
