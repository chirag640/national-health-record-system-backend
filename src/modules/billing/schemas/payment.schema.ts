import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { addSoftDeletePlugin } from '../../../common/soft-delete.plugin';
import { PaymentMethod } from './invoice.schema';

export type PaymentDocument = Payment & Document;
export { PaymentMethod };

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentGateway {
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
  PAYTM = 'paytm',
  PHONEPE = 'phonepe',
  GPAY = 'gpay',
  CASH = 'cash',
  BANK_TRANSFER = 'bank-transfer',
}

@Schema({ _id: false })
export class PaymentGatewayResponse {
  @Prop()
  orderId?: string;

  @Prop()
  paymentId?: string;

  @Prop()
  signature?: string;

  @Prop()
  status?: string;

  @Prop()
  errorCode?: string;

  @Prop()
  errorDescription?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  rawResponse?: Record<string, any>;
}

const PaymentGatewayResponseSchema = SchemaFactory.createForClass(PaymentGatewayResponse);

@Schema({ timestamps: true })
export class Payment {
  @Prop()
  paymentNumber?: string; // AUTO: PAY-2024-NNNNNN

  @Prop({ required: true, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  // Related Entities
  @Prop({ required: true })
  patientId!: string; // Patient GUID

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'Hospital' })
  hospitalId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'Invoice' })
  invoiceId!: Types.ObjectId;

  @Prop()
  invoiceNumber?: string; // For quick reference

  // Payment Details
  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ default: 'INR' })
  currency!: string;

  @Prop({ required: true, enum: Object.values(PaymentMethod) })
  paymentMethod!: PaymentMethod;

  @Prop({ required: true, enum: Object.values(PaymentGateway) })
  paymentGateway!: PaymentGateway;

  @Prop()
  transactionId?: string; // External transaction ID

  @Prop()
  orderId?: string; // Payment gateway order ID

  @Prop()
  receiptNumber?: string; // Internal receipt number

  // Payment Gateway Response
  @Prop({ type: PaymentGatewayResponseSchema })
  gatewayResponse?: PaymentGatewayResponse;

  // Timing
  @Prop()
  initiatedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  failedAt?: Date;

  // Payer Information
  @Prop({ required: true })
  payerName!: string;

  @Prop()
  payerEmail?: string;

  @Prop()
  payerPhone?: string;

  // Bank/Card Details (masked)
  @Prop()
  cardLast4?: string;

  @Prop()
  cardBrand?: string; // Visa, Mastercard, etc.

  @Prop()
  bankName?: string;

  @Prop()
  upiId?: string;

  // Fees & Charges
  @Prop({ min: 0, default: 0 })
  processingFee?: number;

  @Prop({ min: 0, default: 0 })
  gatewayFee?: number;

  @Prop({ min: 0, default: 0 })
  tax?: number;

  @Prop({ required: true, min: 0 })
  netAmount!: number; // Amount after deducting fees

  // Refund Details
  @Prop({ default: false })
  isRefunded!: boolean;

  @Prop({ min: 0, default: 0 })
  refundAmount?: number;

  @Prop()
  refundTransactionId?: string;

  @Prop()
  refundedAt?: Date;

  @Prop()
  refundReason?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  refundedBy?: Types.ObjectId;

  // Additional Information
  @Prop()
  notes?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  // Notifications
  @Prop({ default: false })
  receiptSent?: boolean;

  @Prop()
  receiptSentAt?: Date;

  // Soft Delete
  @Prop()
  deletedAt?: Date;

  // Timestamps
  createdAt!: Date;
  updatedAt!: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Apply soft delete plugin
addSoftDeletePlugin(PaymentSchema);

// Indexes for performance
PaymentSchema.index({ paymentNumber: 1 });
PaymentSchema.index({ patientId: 1, status: 1 });
PaymentSchema.index({ hospitalId: 1, status: 1 });
PaymentSchema.index({ invoiceId: 1 });
PaymentSchema.index({ invoiceNumber: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentMethod: 1 });
PaymentSchema.index({ paymentGateway: 1 });
PaymentSchema.index({ completedAt: -1 });
PaymentSchema.index({ deletedAt: 1 });
PaymentSchema.index({ createdAt: -1 });

// Pre-save middleware to generate payment number
PaymentSchema.pre('save', async function (next) {
  if (!this.paymentNumber) {
    const year = new Date().getFullYear();
    const count = await (this.constructor as any).countDocuments();
    this.paymentNumber = `PAY-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  // Set timing based on status
  if (this.status === PaymentStatus.COMPLETED && !this.completedAt) {
    this.completedAt = new Date();
  }

  if (this.status === PaymentStatus.FAILED && !this.failedAt) {
    this.failedAt = new Date();
  }

  // Calculate net amount if not set
  if (!this.netAmount) {
    this.netAmount =
      this.amount - (this.processingFee || 0) - (this.gatewayFee || 0) - (this.tax || 0);
  }

  next();
});

// Virtual for processing time (in seconds)
PaymentSchema.virtual('processingTime').get(function () {
  if (!this.initiatedAt || !this.completedAt) {
    return 0;
  }
  return Math.floor((this.completedAt.getTime() - this.initiatedAt.getTime()) / 1000);
});

// Virtual for is successful
PaymentSchema.virtual('isSuccessful').get(function () {
  return this.status === PaymentStatus.COMPLETED;
});

// Virtual for can refund
PaymentSchema.virtual('canRefund').get(function () {
  return this.status === PaymentStatus.COMPLETED && !this.isRefunded;
});

// Ensure virtuals are included in JSON
PaymentSchema.set('toJSON', { virtuals: true });
PaymentSchema.set('toObject', { virtuals: true });
