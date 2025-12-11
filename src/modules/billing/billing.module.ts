import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { BillingController } from './billing.controller';
import { BillingService, RazorpayService, InvoicePdfService } from './services';
import { InvoiceRepository, PaymentRepository } from './repositories';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { NotificationModule } from '../notification/notification.module';
import { EmailModule } from '../../email/email.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
    NotificationModule,
    EmailModule,
  ],
  controllers: [BillingController],
  providers: [
    BillingService,
    RazorpayService,
    InvoicePdfService,
    InvoiceRepository,
    PaymentRepository,
  ],
  exports: [
    BillingService,
    RazorpayService,
    InvoicePdfService,
    InvoiceRepository,
    PaymentRepository,
  ],
})
export class BillingModule {}
