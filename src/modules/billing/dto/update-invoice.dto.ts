import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsEnum, IsOptional, IsNumber, Min, IsDate, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateInvoiceDto } from './create-invoice.dto';
import { InvoiceStatus } from '../schemas/invoice.schema';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @ApiPropertyOptional({
    description: 'Invoice status',
    enum: InvoiceStatus,
    example: InvoiceStatus.PAID,
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    description: 'Amount paid towards this invoice',
    example: 5000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({
    description: 'Reason for invoice cancellation',
    example: 'Patient requested cancellation',
  })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class RecordPaymentDto {
  @ApiPropertyOptional({
    description: 'Payment amount',
    example: 1000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({
    description: 'Payment method used',
    example: 'cash',
  })
  @IsString()
  method!: string;

  @ApiPropertyOptional({
    description: 'Transaction ID from payment gateway',
    example: 'TXN123456',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the payment',
    example: 'Paid in full',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInsuranceClaimDto {
  @ApiPropertyOptional({
    description: 'Insurance claim reference number',
    example: 'CLM-2024-123456',
  })
  @IsOptional()
  @IsString()
  claimNumber?: string;

  @ApiPropertyOptional({
    description: 'Amount approved by insurance',
    example: 4500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;

  @ApiPropertyOptional({
    description: 'Claim status',
    example: 'approved',
    enum: ['pending', 'approved', 'rejected', 'processing'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Date when claim was approved',
    example: '2024-12-10T10:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  approvedAt?: Date;

  @ApiPropertyOptional({
    description: 'Reason for claim rejection',
    example: 'Pre-existing condition not covered',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({
    description: 'Supporting document IDs',
    example: ['doc1', 'doc2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Claim processed successfully',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProcessRefundDto {
  @ApiPropertyOptional({
    description: 'Refund amount',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({
    description: 'Reason for refund',
    example: 'Service not provided',
  })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({
    description: 'Refund transaction ID',
    example: 'REFUND-123456',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;
}
