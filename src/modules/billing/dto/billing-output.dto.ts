import { Exclude, Expose, Type } from 'class-transformer';
import { InvoiceStatus, ServiceType, PaymentMethod } from '../schemas/invoice.schema';
import { PaymentStatus, PaymentGateway } from '../schemas/payment.schema';

export class InvoiceItemOutputDto {
  @Expose()
  itemId!: string;

  @Expose()
  serviceType!: ServiceType;

  @Expose()
  description!: string;

  @Expose()
  code?: string;

  @Expose()
  quantity!: number;

  @Expose()
  unitPrice!: number;

  @Expose()
  discountPercent?: number;

  @Expose()
  discountAmount?: number;

  @Expose()
  taxPercent?: number;

  @Expose()
  taxAmount?: number;

  @Expose()
  totalAmount!: number;

  @Expose()
  notes?: string;
}

export class InsuranceClaimOutputDto {
  @Expose()
  insuranceProvider!: string;

  @Expose()
  policyNumber!: string;

  @Expose()
  claimNumber?: string;

  @Expose()
  claimAmount!: number;

  @Expose()
  approvedAmount?: number;

  @Expose()
  status!: string;

  @Expose()
  submittedAt?: Date;

  @Expose()
  approvedAt?: Date;

  @Expose()
  rejectionReason?: string;

  @Expose()
  documents!: string[];

  @Expose()
  notes?: string;
}

export class PaymentRecordOutputDto {
  @Expose()
  paymentId!: string;

  @Expose()
  amount!: number;

  @Expose()
  method!: PaymentMethod;

  @Expose()
  paidAt!: Date;

  @Expose()
  transactionId?: string;

  @Expose()
  notes?: string;
}

export class InvoiceOutputDto {
  @Expose()
  _id!: string;

  @Expose()
  invoiceNumber!: string;

  @Expose()
  status!: InvoiceStatus;

  @Expose()
  patientId!: string;

  @Expose()
  doctorId?: string;

  @Expose()
  hospitalId!: string;

  @Expose()
  appointmentId?: string;

  @Expose()
  encounterId?: string;

  @Expose()
  telemedicineSessionId?: string;

  @Expose()
  invoiceDate!: Date;

  @Expose()
  dueDate!: Date;

  @Expose()
  @Type(() => InvoiceItemOutputDto)
  items!: InvoiceItemOutputDto[];

  @Expose()
  subtotal!: number;

  @Expose()
  totalDiscount!: number;

  @Expose()
  totalTax!: number;

  @Expose()
  totalAmount!: number;

  @Expose()
  paidAmount!: number;

  @Expose()
  balanceAmount!: number;

  @Expose()
  @Type(() => PaymentRecordOutputDto)
  payments!: PaymentRecordOutputDto[];

  @Expose()
  currency!: string;

  @Expose()
  @Type(() => InsuranceClaimOutputDto)
  insuranceClaim?: InsuranceClaimOutputDto;

  @Expose()
  patientName!: string;

  @Expose()
  patientEmail?: string;

  @Expose()
  patientPhone?: string;

  @Expose()
  patientAddress?: string;

  @Expose()
  hospitalName!: string;

  @Expose()
  hospitalAddress?: string;

  @Expose()
  notes?: string;

  @Expose()
  termsAndConditions?: string;

  @Expose()
  attachments!: string[];

  @Expose()
  isOverdue?: boolean; // Virtual

  @Expose()
  daysOverdue?: number; // Virtual

  @Expose()
  paymentPercentage?: number; // Virtual

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  patientGSTIN?: string;

  @Exclude()
  hospitalGSTIN?: string;

  @Exclude()
  hospitalPAN?: string;

  @Exclude()
  cancelledBy?: string;

  @Exclude()
  cancellationReason?: string;

  @Exclude()
  cancelledAt?: Date;

  @Exclude()
  refundAmount?: number;

  @Exclude()
  refundedAt?: Date;

  @Exclude()
  refundTransactionId?: string;

  @Exclude()
  metadata?: any;

  @Exclude()
  deletedAt?: Date;
}

export class PaymentOutputDto {
  @Expose()
  _id!: string;

  @Expose()
  paymentNumber!: string;

  @Expose()
  status!: PaymentStatus;

  @Expose()
  patientId!: string;

  @Expose()
  hospitalId!: string;

  @Expose()
  invoiceId!: string;

  @Expose()
  invoiceNumber?: string;

  @Expose()
  amount!: number;

  @Expose()
  currency!: string;

  @Expose()
  paymentMethod!: PaymentMethod;

  @Expose()
  paymentGateway!: PaymentGateway;

  @Expose()
  transactionId?: string;

  @Expose()
  orderId?: string;

  @Expose()
  receiptNumber?: string;

  @Expose()
  initiatedAt?: Date;

  @Expose()
  completedAt?: Date;

  @Expose()
  payerName!: string;

  @Expose()
  payerEmail?: string;

  @Expose()
  payerPhone?: string;

  @Expose()
  cardLast4?: string;

  @Expose()
  cardBrand?: string;

  @Expose()
  bankName?: string;

  @Expose()
  upiId?: string;

  @Expose()
  processingFee?: number;

  @Expose()
  gatewayFee?: number;

  @Expose()
  tax?: number;

  @Expose()
  netAmount!: number;

  @Expose()
  isRefunded!: boolean;

  @Expose()
  refundAmount?: number;

  @Expose()
  refundedAt?: Date;

  @Expose()
  refundReason?: string;

  @Expose()
  notes?: string;

  @Expose()
  receiptSent?: boolean;

  @Expose()
  receiptSentAt?: Date;

  @Expose()
  processingTime?: number; // Virtual

  @Expose()
  isSuccessful?: boolean; // Virtual

  @Expose()
  canRefund?: boolean; // Virtual

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  refundTransactionId?: string;

  @Exclude()
  refundedBy?: string;

  @Exclude()
  ipAddress?: string;

  @Exclude()
  userAgent?: string;

  @Exclude()
  metadata?: any;

  @Exclude()
  gatewayResponse?: any;

  @Exclude()
  deletedAt?: Date;
}

export class PaginatedInvoicesDto {
  @Expose()
  @Type(() => InvoiceOutputDto)
  data!: InvoiceOutputDto[];

  @Expose()
  total!: number;

  @Expose()
  page!: number;

  @Expose()
  limit!: number;

  @Expose()
  totalPages!: number;

  @Expose()
  hasNextPage!: boolean;

  @Expose()
  hasPreviousPage!: boolean;
}

export class PaginatedPaymentsDto {
  @Expose()
  @Type(() => PaymentOutputDto)
  data!: PaymentOutputDto[];

  @Expose()
  total!: number;

  @Expose()
  page!: number;

  @Expose()
  limit!: number;

  @Expose()
  totalPages!: number;

  @Expose()
  hasNextPage!: boolean;

  @Expose()
  hasPreviousPage!: boolean;
}

export class BillingStatsDto {
  @Expose()
  totalInvoices!: number;

  @Expose()
  draftInvoices!: number;

  @Expose()
  pendingInvoices!: number;

  @Expose()
  paidInvoices!: number;

  @Expose()
  overdueInvoices!: number;

  @Expose()
  cancelledInvoices!: number;

  @Expose()
  totalRevenue!: number;

  @Expose()
  paidRevenue!: number;

  @Expose()
  pendingRevenue!: number;

  @Expose()
  overdueRevenue!: number;

  @Expose()
  averageInvoiceAmount!: number;

  @Expose()
  byServiceType!: Record<ServiceType, number>;
}

export class RazorpayOrderDto {
  @Expose()
  orderId!: string;

  @Expose()
  amount!: number;

  @Expose()
  currency!: string;

  @Expose()
  key!: string; // Razorpay key for frontend

  @Expose()
  invoiceId!: string;

  @Expose()
  invoiceNumber!: string;
}
