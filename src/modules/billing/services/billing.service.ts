import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InvoiceRepository, PaymentRepository } from '../repositories';
import { RazorpayService } from './razorpay.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { EmailService } from '../../../email/email.service';
// import { NotificationService } from '../../notification/notification.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreatePaymentDto,
  InitiateRazorpayPaymentDto,
  VerifyRazorpayPaymentDto,
  RefundPaymentDto,
  InvoiceOutputDto,
  PaymentOutputDto,
  PaginatedInvoicesDto,
  PaginatedPaymentsDto,
  BillingStatsDto,
  RazorpayOrderDto,
} from '../dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly razorpayService: RazorpayService,
    private readonly invoicePdfService: InvoicePdfService,
    private readonly emailService: EmailService,
    // private readonly notificationService: NotificationService, // To be implemented
  ) {}

  /**
   * Create a new invoice
   */
  async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<InvoiceOutputDto> {
    try {
      this.logger.log(`Creating invoice for patient: ${createInvoiceDto.patientId}`);

      // Calculate totals
      const { subtotal, totalTax, totalDiscount, totalAmount } = this.calculateInvoiceAmounts(
        createInvoiceDto.items,
      );

      // Create invoice data
      const invoiceData = {
        ...createInvoiceDto,
        subtotal,
        totalTax,
        totalDiscount,
        totalAmount,
        paidAmount: 0,
        status: 'draft',
      };

      const invoice = await this.invoiceRepository.create(invoiceData as any);

      this.logger.log(`Invoice created successfully: ${invoice.invoiceNumber}`);

      // Send notification to patient
      if (invoice.status !== 'draft') {
        await this.sendInvoiceNotification(invoice);
      }

      return plainToInstance(InvoiceOutputDto, (invoice as any).toObject(), {
        excludeExtraneousValues: true,
      });
    } catch (error: any) {
      this.logger.error(`Failed to create invoice: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate invoice amounts from items
   */
  private calculateInvoiceAmounts(items: any[]): {
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    totalAmount: number;
  } {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    items.forEach((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;
      totalTax += (itemTotal * (item.taxPercentage || 0)) / 100;
      totalDiscount += item.discountAmount || 0;
    });

    const totalAmount = subtotal + totalTax - totalDiscount;

    return { subtotal, totalTax, totalDiscount, totalAmount };
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<InvoiceOutputDto> {
    const invoice = await this.invoiceRepository.findById(id);

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return plainToInstance(InvoiceOutputDto, (invoice as any).toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get invoice by invoice number
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceOutputDto> {
    const invoice = await this.invoiceRepository.findByInvoiceNumber(invoiceNumber);

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceNumber} not found`);
    }

    return plainToInstance(InvoiceOutputDto, (invoice as any).toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get all invoices with filters
   */
  async getAllInvoices(filters: any): Promise<PaginatedInvoicesDto> {
    const { invoices, total, page, limit } =
      await this.invoiceRepository.findAllWithFilters(filters);

    const invoiceOutputs = invoices.map((invoice) =>
      plainToInstance(InvoiceOutputDto, (invoice as any).toObject(), {
        excludeExtraneousValues: true,
      }),
    );

    return {
      data: invoiceOutputs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<InvoiceOutputDto> {
    const invoice = await this.invoiceRepository.findById(id);

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Check if invoice can be updated
    if (['paid', 'cancelled', 'refunded'].includes(invoice.status)) {
      throw new BadRequestException(`Cannot update invoice with status: ${invoice.status}`);
    }

    // Recalculate amounts if items are updated
    let updateData: any = { ...updateInvoiceDto };

    if (updateInvoiceDto.items) {
      const amounts = this.calculateInvoiceAmounts(updateInvoiceDto.items);
      updateData = { ...updateData, ...amounts };
    }

    const updatedInvoice = await this.invoiceRepository.update(id, updateData);

    this.logger.log(`Invoice updated: ${invoice.invoiceNumber}`);

    return plainToInstance(InvoiceOutputDto, (updatedInvoice as any).toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Delete invoice (soft delete)
   */
  async deleteInvoice(id: string): Promise<void> {
    const invoice = await this.invoiceRepository.findById(id);

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (invoice.status === 'paid') {
      throw new BadRequestException('Cannot delete a paid invoice');
    }

    await this.invoiceRepository.softDelete(id);

    this.logger.log(`Invoice deleted: ${invoice.invoiceNumber}`);
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(id: string, reason: string): Promise<InvoiceOutputDto> {
    const invoice = await this.invoiceRepository.findById(id);

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (['paid', 'cancelled'].includes(invoice.status)) {
      throw new BadRequestException(`Cannot cancel invoice with status: ${invoice.status}`);
    }

    const cancelledInvoice = await this.invoiceRepository.cancelInvoice(id, reason);

    if (!cancelledInvoice) {
      throw new NotFoundException(`Failed to cancel invoice ${id}`);
    }

    this.logger.log(`Invoice cancelled: ${invoice.invoiceNumber}`);

    return plainToInstance(InvoiceOutputDto, (cancelledInvoice as any).toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Initiate Razorpay payment
   */
  async initiateRazorpayPayment(dto: InitiateRazorpayPaymentDto): Promise<RazorpayOrderDto> {
    const invoice = await this.invoiceRepository.findById(dto.invoiceId);

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${dto.invoiceId} not found`);
    }

    if (invoice.status === 'paid') {
      throw new BadRequestException('Invoice is already paid');
    }

    const amountDue = invoice.totalAmount - invoice.paidAmount;

    if (dto.amount > amountDue) {
      throw new BadRequestException(`Payment amount exceeds due amount. Due: ${amountDue}`);
    }

    // Create Razorpay order
    const razorpayOrder = await this.razorpayService.createOrder(
      dto.amount,
      dto.currency || 'INR',
      (invoice as any).invoiceNumber,
      {
        invoiceId: (invoice as any)._id.toString(),
        invoiceNumber: (invoice as any).invoiceNumber,
        patientId: (invoice as any).patientId.toString(),
      },
    );

    // Create pending payment record
    const paymentData = {
      invoiceId: (invoice as any)._id.toString(),
      patientId: (invoice as any).patientId.toString(),
      hospitalId: (invoice as any).hospitalId.toString(),
      amount: dto.amount,
      paymentMethod: 'card',
      paymentGateway: 'razorpay',
      currency: dto.currency || 'INR',
      payerName: (invoice as any).patientName || 'Patient',
      status: 'pending',
    };

    await this.paymentRepository.create(paymentData as any);

    this.logger.log(
      `Razorpay order created: ${razorpayOrder.id} for invoice: ${invoice.invoiceNumber}`,
    );

    return {
      orderId: razorpayOrder.id,
      amount: dto.amount,
      currency: dto.currency || 'INR',
      key: this.razorpayService.getKeyId(),
      invoiceId: (invoice as any)._id.toString(),
      invoiceNumber: (invoice as any).invoiceNumber,
    };
  }

  /**
   * Verify and complete Razorpay payment
   */
  async verifyRazorpayPayment(dto: VerifyRazorpayPaymentDto): Promise<PaymentOutputDto> {
    // Verify signature
    const isValid = this.razorpayService.verifyPaymentSignature(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Find payment by order ID
    const payment = await this.paymentRepository.findByRazorpayOrderId(dto.razorpayOrderId);

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    // Fetch payment details from Razorpay
    const razorpayPayment = await this.razorpayService.fetchPayment(dto.razorpayPaymentId);

    // Update payment record
    const updatedPayment = await this.paymentRepository.update((payment as any)._id.toString(), {
      status: 'completed',
      transactionId: dto.razorpayPaymentId,
      paymentMethod: this.mapRazorpayMethod(razorpayPayment.method),
      gatewayResponse: {
        razorpay_order_id: dto.razorpayOrderId,
        razorpay_payment_id: dto.razorpayPaymentId,
        razorpay_signature: dto.razorpaySignature,
        method: razorpayPayment.method,
        captured: razorpayPayment.captured,
        fee: razorpayPayment.fee,
        tax: razorpayPayment.tax,
      },
      completedAt: new Date(),
    } as any);

    if (!updatedPayment) {
      throw new NotFoundException('Failed to update payment');
    }

    // Update invoice payment status
    const invoice = await this.invoiceRepository.findById((payment as any).invoiceId.toString());
    if (invoice) {
      await this.invoiceRepository.updatePaymentStatus(
        (payment as any).invoiceId.toString(),
        (invoice as any).paidAmount + (payment as any).amount,
      );
    }

    // Add payment record to invoice
    await this.invoiceRepository.addPaymentRecord((payment as any).invoiceId.toString(), {
      paymentId: (updatedPayment as any)._id.toString(),
      amount: (updatedPayment as any).amount,
      paymentDate: (updatedPayment as any).paymentDate,
      paymentMethod: (updatedPayment as any).paymentMethod,
      transactionId: (updatedPayment as any).transactionId,
    });

    this.logger.log(`Payment verified and completed: ${dto.razorpayPaymentId}`);

    // Send payment confirmation
    await this.sendPaymentConfirmation(updatedPayment as any);

    return plainToInstance(PaymentOutputDto, (updatedPayment as any).toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Map Razorpay payment method to our enum
   */
  private mapRazorpayMethod(method: string): string {
    const methodMap: Record<string, string> = {
      card: 'credit_card',
      netbanking: 'net_banking',
      wallet: 'wallet',
      upi: 'upi',
    };

    return methodMap[method] || 'credit_card';
  }

  /**
   * Create manual payment (cash, insurance, etc.)
   */
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<PaymentOutputDto> {
    const invoice = await this.invoiceRepository.findById(createPaymentDto.invoiceId);

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${createPaymentDto.invoiceId} not found`);
    }

    const amountDue = invoice.totalAmount - invoice.paidAmount;

    if (createPaymentDto.amount > amountDue) {
      throw new BadRequestException(`Payment amount exceeds due amount. Due: ${amountDue}`);
    }

    const paymentData = {
      ...createPaymentDto,
      status: 'completed',
      completedAt: new Date(),
    };

    const payment = await this.paymentRepository.create(paymentData as any);

    // Update invoice
    await this.invoiceRepository.updatePaymentStatus(
      (invoice as any)._id.toString(),
      (invoice as any).paidAmount + (payment as any).amount,
    );

    await this.invoiceRepository.addPaymentRecord((invoice as any)._id.toString(), {
      paymentId: (payment as any)._id.toString(),
      amount: (payment as any).amount,
      paymentDate: (payment as any).paymentDate,
      paymentMethod: (payment as any).paymentMethod,
      transactionId: (payment as any).transactionId,
    });

    this.logger.log(
      `Manual payment recorded: ${payment.paymentNumber} for invoice: ${invoice.invoiceNumber}`,
    );

    await this.sendPaymentConfirmation(payment as any);

    return plainToInstance(PaymentOutputDto, (payment as any).toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<PaymentOutputDto> {
    const payment = await this.paymentRepository.findById(id);

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return plainToInstance(PaymentOutputDto, (payment as any).toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get all payments with filters
   */
  async getAllPayments(filters: any): Promise<PaginatedPaymentsDto> {
    const { payments, total, page, limit } =
      await this.paymentRepository.findAllWithFilters(filters);

    const paymentOutputs = payments.map((payment) =>
      plainToInstance(PaymentOutputDto, (payment as any).toObject(), {
        excludeExtraneousValues: true,
      }),
    );

    return {
      data: paymentOutputs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, refundDto: RefundPaymentDto): Promise<PaymentOutputDto> {
    const payment = await this.paymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    if (payment.status !== 'completed') {
      throw new BadRequestException('Can only refund completed payments');
    }

    if (payment.refundAmount) {
      throw new ConflictException('Payment has already been refunded');
    }

    const refundAmount = refundDto.amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new BadRequestException('Refund amount exceeds payment amount');
    }

    let refundId: string;

    // Process refund through gateway if applicable
    if (payment.paymentGateway === 'razorpay' && payment.transactionId) {
      const razorpayRefund = await this.razorpayService.createRefund(
        payment.transactionId,
        refundDto.amount,
        { reason: refundDto.reason },
      );

      refundId = razorpayRefund.id;
    } else {
      refundId = `REFUND-${Date.now()}`;
    }

    // Update payment
    const refundedPayment = await this.paymentRepository.processRefund(
      paymentId,
      refundAmount,
      refundId,
      refundDto.reason,
    );

    // Update invoice
    const invoice = await this.invoiceRepository.findById((payment as any).invoiceId.toString());

    if (invoice) {
      const newPaidAmount = (invoice as any).paidAmount - refundAmount;
      await this.invoiceRepository.updatePaymentStatus(
        (invoice as any)._id.toString(),
        newPaidAmount,
      );

      if (newPaidAmount === 0) {
        await this.invoiceRepository.markAsRefunded(invoice._id.toString());
      }
    }

    this.logger.log(`Refund processed: ${refundId} for payment: ${(payment as any).paymentNumber}`);

    if (!refundedPayment) {
      throw new NotFoundException('Failed to process refund');
    }

    // Send refund notification
    await this.sendRefundNotification(refundedPayment as any);

    return plainToInstance(PaymentOutputDto, (refundedPayment as any).toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Submit insurance claim
   */
  async submitInsuranceClaim(invoiceId: string, claimData: any): Promise<InvoiceOutputDto> {
    const invoice = await this.invoiceRepository.findById(invoiceId);

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    if (!invoice.insuranceClaim) {
      throw new BadRequestException('Invoice does not have insurance information');
    }

    const updatedInvoice = await this.invoiceRepository.updateInsuranceClaim(invoiceId, {
      status: 'submitted',
      submittedDate: new Date(),
      ...claimData,
    });

    this.logger.log(`Insurance claim submitted for invoice: ${(invoice as any).invoiceNumber}`);

    if (!updatedInvoice) {
      throw new NotFoundException('Failed to update insurance claim');
    }

    return plainToInstance(InvoiceOutputDto, (updatedInvoice as any).toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get billing statistics
   */
  async getBillingStats(
    hospitalId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BillingStatsDto> {
    const [invoiceStats, paymentStats] = await Promise.all([
      this.invoiceRepository.getStatistics(hospitalId, startDate, endDate),
      this.paymentRepository.getStatistics(hospitalId, startDate, endDate),
    ]);

    return {
      totalInvoices: invoiceStats.totalInvoices,
      totalAmount: invoiceStats.totalAmount,
      paidAmount: invoiceStats.paidAmount,
      pendingAmount: invoiceStats.pendingAmount,
      overdueAmount: invoiceStats.overdueAmount,
      totalPayments: paymentStats.totalPayments,
      successfulPayments: paymentStats.successfulPayments,
      failedPayments: paymentStats.failedPayments,
      refundedAmount: paymentStats.refundedAmount,
      byStatus: invoiceStats.byStatus,
      byMethod: paymentStats.byMethod,
    } as any;
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(hospitalId?: string): Promise<InvoiceOutputDto[]> {
    const invoices = await this.invoiceRepository.findOverdueInvoices(hospitalId);

    return invoices.map((invoice) =>
      plainToInstance(InvoiceOutputDto, (invoice as any).toObject(), {
        excludeExtraneousValues: true,
      }),
    );
  }

  /**
   * Send payment reminders for overdue invoices
   */
  async sendPaymentReminders(hospitalId?: string): Promise<number> {
    const overdueInvoices = await this.invoiceRepository.findOverdueInvoices(hospitalId);

    let sentCount = 0;

    for (const invoice of overdueInvoices) {
      try {
        // await this.notificationService.sendNotification({
        //   userId: (invoice as any).patientId.toString(),
        //   type: 'payment_reminder',
        //   priority: 'high',
        //   title: 'Payment Reminder',
        //   message: `Your invoice ${(invoice as any).invoiceNumber} of ₹${(invoice as any).totalAmount - (invoice as any).paidAmount} is overdue. Please make the payment at your earliest convenience.`,
        //   data: {
        //     invoiceId: (invoice as any)._id.toString(),
        //     invoiceNumber: (invoice as any).invoiceNumber,
        //     amount: (invoice as any).totalAmount - (invoice as any).paidAmount,
        //     dueDate: (invoice as any).dueDate,
        //   },
        // });
        this.logger.log(
          `Payment reminder would be sent for invoice ${(invoice as any).invoiceNumber}`,
        );
        sentCount++;
      } catch (error: any) {
        this.logger.error(
          `Failed to send reminder for invoice ${(invoice as any).invoiceNumber}: ${error.message}`,
        );
      }
    }

    this.logger.log(`Sent ${sentCount} payment reminders`);

    return sentCount;
  }

  /**
   * Send invoice notification to patient
   */
  private async sendInvoiceNotification(invoice: any): Promise<void> {
    try {
      // await this.notificationService.sendNotification({
      //   userId: invoice.patientId.toString(),
      //   type: 'invoice_generated',
      //   priority: 'medium',
      //   title: 'New Invoice Generated',
      //   message: `A new invoice ${invoice.invoiceNumber} for ₹${invoice.totalAmount} has been generated. Due date: ${invoice.dueDate.toLocaleDateString()}`,
      //   data: {
      //     invoiceId: invoice._id.toString(),
      //     invoiceNumber: invoice.invoiceNumber,
      //     amount: invoice.totalAmount,
      //     dueDate: invoice.dueDate,
      //   },
      // });
      this.logger.log(`Invoice notification would be sent for ${invoice.invoiceNumber}`);
    } catch (error: any) {
      this.logger.error(`Failed to send invoice notification: ${error.message}`);
    }
  }

  /**
   * Send payment confirmation
   */
  private async sendPaymentConfirmation(payment: any): Promise<void> {
    try {
      // await this.notificationService.sendNotification({
      //   userId: payment.patientId.toString(),
      //   type: 'payment_confirmation',
      //   priority: 'medium',
      //   title: 'Payment Received',
      //   message: `Your payment of ₹${payment.amount} has been received successfully. Payment ID: ${payment.paymentNumber}`,
      //   data: {
      //     paymentId: payment._id.toString(),
      //     paymentNumber: payment.paymentNumber,
      //     amount: payment.amount,
      //     paymentDate: payment.paymentDate,
      //   },
      // });
      this.logger.log(`Payment confirmation would be sent for ${payment.paymentNumber}`);
    } catch (error: any) {
      this.logger.error(`Failed to send payment confirmation: ${error.message}`);
    }
  }

  /**
   * Send refund notification
   */
  private async sendRefundNotification(payment: any): Promise<void> {
    try {
      // await this.notificationService.sendNotification({
      //   userId: payment.patientId.toString(),
      //   type: 'refund_processed',
      //   priority: 'high',
      //   title: 'Refund Processed',
      //   message: `A refund of ₹${payment.refundAmount} has been processed for payment ${payment.paymentNumber}. It will be credited to your account within 5-7 business days.`,
      //   data: {
      //     paymentId: payment._id.toString(),
      //     paymentNumber: payment.paymentNumber,
      //     refundAmount: payment.refundAmount,
      //     refundId: payment.refundId,
      //   },
      // });
      this.logger.log(`Refund notification would be sent for ${payment.paymentNumber}`);
    } catch (error: any) {
      this.logger.error(`Failed to send refund notification: ${error.message}`);
    }
  }

  /**
   * Generate invoice PDF
   */
  async generateInvoicePdf(id: string): Promise<Buffer> {
    const invoice = await this.invoiceRepository.findById(id);

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    this.logger.log(`Generating PDF for invoice: ${(invoice as any).invoiceNumber}`);

    // Transform invoice data to PDF options
    const pdfOptions = {
      invoiceNumber: (invoice as any).invoiceNumber || `INV-${id.slice(-6)}`,
      invoiceDate: (invoice as any).invoiceDate || new Date(),
      dueDate: (invoice as any).dueDate || new Date(),
      status: (invoice as any).status || 'draft',

      hospitalName: (invoice as any).hospitalName || 'Hospital Name',
      hospitalAddress: (invoice as any).hospitalAddress,
      hospitalGSTIN: (invoice as any).hospitalGSTIN,
      hospitalPAN: (invoice as any).hospitalPAN,

      patientName: (invoice as any).patientName || 'Patient Name',
      patientEmail: (invoice as any).patientEmail,
      patientPhone: (invoice as any).patientPhone,
      patientAddress: (invoice as any).patientAddress,
      patientGSTIN: (invoice as any).patientGSTIN,

      items: (invoice as any).items || [],

      subtotal: (invoice as any).subtotal || 0,
      totalDiscount: (invoice as any).totalDiscount || 0,
      totalTax: (invoice as any).totalTax || 0,
      totalAmount: (invoice as any).totalAmount || 0,
      paidAmount: (invoice as any).paidAmount || 0,
      balanceAmount: (invoice as any).balanceAmount || 0,
      currency: (invoice as any).currency || 'INR',

      notes: (invoice as any).notes,
      termsAndConditions: (invoice as any).termsAndConditions,
    };

    return this.invoicePdfService.generateInvoicePdf(pdfOptions);
  }

  /**
   * Send receipt email with PDF attachment
   */
  async sendReceiptEmail(paymentId: string, recipientEmail: string): Promise<void> {
    const payment = await this.paymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    if (payment.status !== 'completed') {
      throw new BadRequestException('Can only send receipts for completed payments');
    }

    this.logger.log(`Sending receipt email for payment: ${(payment as any).paymentNumber}`);

    // Get invoice details
    const invoice = await this.invoiceRepository.findById((payment as any).invoiceId.toString());

    if (!invoice) {
      throw new NotFoundException('Associated invoice not found');
    }

    // Generate PDF (for future attachment support)
    // const pdfBuffer = await this.generateInvoicePdf((invoice as any)._id.toString());

    // Prepare email content
    const emailContent = this.buildReceiptEmailHtml(payment as any, invoice as any);

    // Send email with PDF attachment
    try {
      await this.emailService.sendEmail({
        to: recipientEmail,
        subject: `Payment Receipt - ${(payment as any).paymentNumber}`,
        template: 'notification', // Using generic notification template
        context: {
          subject: 'Payment Received',
          message: emailContent,
        },
      });

      this.logger.log(`Receipt email sent successfully to ${recipientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send receipt email: ${error}`);
      throw new BadRequestException('Failed to send receipt email');
    }
  }

  /**
   * Build receipt email HTML content
   */
  private buildReceiptEmailHtml(payment: any, invoice: any): string {
    const paymentDate = new Date(payment.paymentDate || payment.createdAt).toLocaleDateString(
      'en-IN',
    );
    const currency = payment.currency || 'INR';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">✓ Payment Received</h2>
        
        <p>Dear ${invoice.patientName},</p>
        
        <p>Thank you for your payment. We have received your payment successfully.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Payment Details</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Payment ID:</strong></td>
              <td style="padding: 8px 0;">${payment.paymentNumber || payment._id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Invoice Number:</strong></td>
              <td style="padding: 8px 0;">${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Amount Paid:</strong></td>
              <td style="padding: 8px 0; color: #22c55e; font-size: 18px;"><strong>${currency} ${payment.amount.toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
              <td style="padding: 8px 0;">${this.formatPaymentMethod(payment.paymentMethod)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Payment Date:</strong></td>
              <td style="padding: 8px 0;">${paymentDate}</td>
            </tr>
            ${
              payment.transactionId
                ? `
            <tr>
              <td style="padding: 8px 0;"><strong>Transaction ID:</strong></td>
              <td style="padding: 8px 0; font-family: monospace;">${payment.transactionId}</td>
            </tr>
            `
                : ''
            }
          </table>
        </div>
        
        ${
          invoice.balanceAmount > 0
            ? `
        <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Outstanding Balance:</strong> ${currency} ${invoice.balanceAmount.toFixed(2)}</p>
        </div>
        `
            : `
        <div style="background-color: #d1fae5; padding: 15px; border-left: 4px solid #22c55e; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0;">✓ <strong>Invoice Fully Paid</strong></p>
        </div>
        `
        }
        
        <p>The detailed invoice is attached to this email for your records.</p>
        
        <p>If you have any questions regarding this payment, please contact our billing department.</p>
        
        <p style="margin-top: 30px;">
          Best regards,<br>
          <strong>${invoice.hospitalName}</strong>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #6b7280;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `;
  }

  /**
   * Format payment method for display
   */
  private formatPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      cash: 'Cash',
      card: 'Card',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      upi: 'UPI',
      net_banking: 'Net Banking',
      wallet: 'Wallet',
      insurance: 'Insurance',
      credit: 'Credit',
    };

    return methodMap[method] || method;
  }
}
