import {
  IsString,
  IsEnum,
  IsNumber,
  IsDate,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '../schemas/invoice.schema';

export class CreateInvoiceItemDto {
  @ApiProperty({
    description: 'ID of the service/item from the hospital catalog',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  itemId!: string;

  @ApiProperty({
    description: 'Type of service provided',
    enum: ServiceType,
    example: ServiceType.CONSULTATION,
  })
  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @ApiProperty({
    description: 'Description of the service or item',
    example: 'General physician consultation - 30 minutes',
  })
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    description: 'Medical code (CPT, ICD-10, or hospital-specific)',
    example: '99213',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: 'Quantity of the service/item',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({
    description: 'Unit price in the invoice currency',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({
    description: 'Discount percentage (0-100)',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({
    description: 'Fixed discount amount',
    example: 50,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Tax percentage (GST/VAT)',
    example: 18,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercent?: number;

  @ApiPropertyOptional({
    description: 'Fixed tax amount',
    example: 90,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({
    description: 'Additional notes for this line item',
    example: 'Follow-up visit recommended in 2 weeks',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class InsuranceClaimDto {
  @ApiProperty({
    description: 'Name of the insurance provider',
    example: 'Star Health Insurance',
  })
  @IsString()
  insuranceProvider!: string;

  @ApiProperty({
    description: "Patient's insurance policy number",
    example: 'POL-2024-12345678',
  })
  @IsString()
  policyNumber!: string;

  @ApiPropertyOptional({
    description: 'Insurance claim reference number',
    example: 'CLM-2024-987654',
  })
  @IsOptional()
  @IsString()
  claimNumber?: string;

  @ApiProperty({
    description: 'Total amount claimed from insurance',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  claimAmount!: number;

  @ApiPropertyOptional({
    description: 'Amount approved by insurance company',
    example: 4500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;

  @ApiPropertyOptional({
    description: 'Current status of the insurance claim',
    example: 'pending',
    enum: ['pending', 'approved', 'rejected', 'processing'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Array of document IDs supporting the claim',
    example: ['doc1_id', 'doc2_id'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @ApiPropertyOptional({
    description: 'Additional notes about the insurance claim',
    example: 'Pre-authorization obtained',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'ID of the patient receiving services',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  patientId!: string;

  @ApiPropertyOptional({
    description: 'ID of the doctor providing services',
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiProperty({
    description: 'ID of the hospital issuing the invoice',
    example: '507f1f77bcf86cd799439013',
  })
  @IsString()
  hospitalId!: string;

  @ApiPropertyOptional({
    description: 'Related appointment ID (if applicable)',
    example: '507f1f77bcf86cd799439014',
  })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional({
    description: 'Related encounter ID (if applicable)',
    example: '507f1f77bcf86cd799439015',
  })
  @IsOptional()
  @IsString()
  encounterId?: string;

  @ApiPropertyOptional({
    description: 'Related telemedicine session ID (if applicable)',
    example: '507f1f77bcf86cd799439016',
  })
  @IsOptional()
  @IsString()
  telemedicineSessionId?: string;

  @ApiProperty({
    description: 'Date the invoice was issued',
    example: '2024-12-10T10:00:00.000Z',
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  invoiceDate!: Date;

  @ApiProperty({
    description: 'Payment due date',
    example: '2024-12-25T10:00:00.000Z',
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  dueDate!: Date;

  @ApiProperty({
    description: 'Array of invoice line items (services/procedures)',
    type: [CreateInvoiceItemDto],
    example: [
      {
        itemId: '507f1f77bcf86cd799439011',
        serviceType: 'consultation',
        description: 'General consultation',
        quantity: 1,
        unitPrice: 500,
        taxPercent: 18,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items!: CreateInvoiceItemDto[];

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'INR',
    default: 'INR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Insurance claim information (if applicable)',
    type: InsuranceClaimDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InsuranceClaimDto)
  insuranceClaim?: InsuranceClaimDto;

  @ApiProperty({
    description: "Patient's full name",
    example: 'Rajesh Kumar',
  })
  @IsString()
  patientName!: string;

  @ApiPropertyOptional({
    description: "Patient's email address",
    example: 'rajesh.kumar@example.com',
  })
  @IsOptional()
  @IsEmail()
  patientEmail?: string;

  @ApiPropertyOptional({
    description: "Patient's contact phone number",
    example: '+91-9876543210',
  })
  @IsOptional()
  @IsString()
  patientPhone?: string;

  @ApiPropertyOptional({
    description: "Patient's billing address",
    example: '123 MG Road, Bangalore, Karnataka 560001',
  })
  @IsOptional()
  @IsString()
  patientAddress?: string;

  @ApiPropertyOptional({
    description: "Patient's GSTIN (for GST invoicing)",
    example: '29ABCDE1234F1Z5',
  })
  @IsOptional()
  @IsString()
  patientGSTIN?: string;

  @ApiProperty({
    description: 'Hospital/clinic name',
    example: 'Apollo Hospital',
  })
  @IsString()
  hospitalName!: string;

  @ApiPropertyOptional({
    description: "Hospital's registered address",
    example: '456 Ring Road, Bangalore, Karnataka 560001',
  })
  @IsOptional()
  @IsString()
  hospitalAddress?: string;

  @ApiPropertyOptional({
    description: "Hospital's GSTIN",
    example: '29ZYXWV9876K1M2',
  })
  @IsOptional()
  @IsString()
  hospitalGSTIN?: string;

  @ApiPropertyOptional({
    description: "Hospital's PAN number",
    example: 'ABCDE1234F',
  })
  @IsOptional()
  @IsString()
  hospitalPAN?: string;

  @ApiPropertyOptional({
    description: 'General notes about the invoice',
    example: 'Payment required within 15 days',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Terms and conditions text',
    example: 'Full payment required before discharge',
  })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;
}
