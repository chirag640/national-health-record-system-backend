import { IsString, IsEnum, IsNumber, IsOptional, Min, IsEmail, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentGateway } from '../schemas/payment.schema';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Patient ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  patientId!: string;

  @ApiProperty({ description: 'Hospital ID', example: '507f1f77bcf86cd799439012' })
  @IsString()
  hospitalId!: string;

  @ApiProperty({ description: 'Invoice ID for this payment', example: '507f1f77bcf86cd799439013' })
  @IsString()
  invoiceId!: string;

  @ApiPropertyOptional({ description: 'Invoice number', example: 'INV-2024-001' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiProperty({ description: 'Payment amount', example: 5000, minimum: 0 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiProperty({
    description: 'Payment gateway used',
    enum: PaymentGateway,
    example: PaymentGateway.RAZORPAY,
  })
  @IsEnum(PaymentGateway)
  paymentGateway!: PaymentGateway;

  @ApiPropertyOptional({ description: 'Gateway transaction ID', example: 'txn_1234567890' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Gateway order ID', example: 'order_1234567890' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ description: 'Name of person making payment', example: 'Rajesh Kumar' })
  @IsString()
  payerName!: string;

  @ApiPropertyOptional({ description: 'Payer email address', example: 'rajesh@example.com' })
  @IsOptional()
  @IsEmail()
  payerEmail?: string;

  @ApiPropertyOptional({ description: 'Payer phone number', example: '+91-9876543210' })
  @IsOptional()
  @IsString()
  payerPhone?: string;

  @ApiPropertyOptional({
    description: 'Last 4 digits of card (for card payments)',
    example: '1234',
  })
  @IsOptional()
  @IsString()
  cardLast4?: string;

  @ApiPropertyOptional({ description: 'Card brand (Visa, Mastercard, etc.)', example: 'Visa' })
  @IsOptional()
  @IsString()
  cardBrand?: string;

  @ApiPropertyOptional({ description: 'Bank name (for net banking/UPI)', example: 'HDFC Bank' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'UPI ID (for UPI payments)', example: 'user@upi' })
  @IsOptional()
  @IsString()
  upiId?: string;

  @ApiPropertyOptional({ description: 'Payment processing fee', example: 50, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  processingFee?: number;

  @ApiPropertyOptional({ description: 'Gateway fee', example: 25, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gatewayFee?: number;

  @ApiPropertyOptional({ description: 'Tax on payment', example: 90, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Payment for consultation' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'IP address of payer', example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Browser user agent', example: 'Mozilla/5.0...' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Additional metadata', type: 'object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class InitiateRazorpayPaymentDto {
  @ApiProperty({
    description: 'Invoice ID to create payment for',
    example: '507f1f77bcf86cd799439013',
  })
  @IsString()
  invoiceId!: string;

  @ApiProperty({
    description: 'Payment amount in smallest currency unit (paise for INR)',
    example: 500000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Notes for the payment order',
    example: 'Payment for medical consultation',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VerifyRazorpayPaymentDto {
  @ApiProperty({
    description: 'Razorpay order ID returned from create order',
    example: 'order_MkVpxPZ7GKsqCZ',
  })
  @IsString()
  razorpayOrderId!: string;

  @ApiProperty({
    description: 'Razorpay payment ID returned after payment',
    example: 'pay_MkVr8xKZ7GKsqD1',
  })
  @IsString()
  razorpayPaymentId!: string;

  @ApiProperty({ description: 'Razorpay signature for verification', example: 'a1b2c3d4e5f6...' })
  @IsString()
  razorpaySignature!: string;

  @ApiProperty({ description: 'Original invoice ID', example: '507f1f77bcf86cd799439013' })
  @IsString()
  invoiceId!: string;
}
