import {
  IsOptional,
  IsEnum,
  IsString,
  IsDate,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus, ServiceType } from '../schemas/invoice.schema';
import { PaymentStatus } from '../schemas/payment.schema';

export class InvoiceFilterDto {
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  encounterId?: string;

  @IsOptional()
  @IsString()
  telemedicineSessionId?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isOverdue?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasPendingPayment?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasInsuranceClaim?: boolean;

  @IsOptional()
  @IsString()
  insuranceProvider?: string;

  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsString()
  search?: string; // Search in invoice number, patient name

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class PaymentFilterDto {
  @IsOptional()
  @IsString()
  paymentNumber?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  paymentGateway?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRefunded?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
