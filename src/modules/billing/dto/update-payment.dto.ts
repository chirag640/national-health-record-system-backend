import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsEnum, IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreatePaymentDto } from './create-payment.dto';
import { PaymentStatus } from '../schemas/payment.schema';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @ApiProperty({ enum: PaymentStatus, description: 'The status of the payment', required: false })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiProperty({ description: 'The ID of the transaction', required: false })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({ description: 'The receipt number of the payment', required: false })
  @IsOptional()
  @IsString()
  receiptNumber?: string;
}

export class RefundPaymentDto {
  @ApiProperty({ description: 'The amount to be refunded', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ description: 'The reason for the refund' })
  @IsString()
  reason!: string;

  @ApiProperty({ description: 'The ID of the refund transaction', required: false })
  @IsOptional()
  @IsString()
  refundTransactionId?: string;
}

export class SendReceiptDto {
  @ApiProperty({
    description: 'Payment ID to send receipt for',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  paymentId!: string;

  @ApiProperty({
    description: 'Email address to send receipt to',
    example: 'patient@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Whether to send SMS notification', default: false, required: false })
  @IsOptional()
  @IsBoolean()
  sendSms?: boolean;
}
