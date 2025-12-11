import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BillingService } from './services/billing.service';
import { UserRole } from '../../auth/schemas/user.schema';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreatePaymentDto,
  InitiateRazorpayPaymentDto,
  VerifyRazorpayPaymentDto,
  RefundPaymentDto,
  SendReceiptDto,
  InvoiceOutputDto,
  PaymentOutputDto,
  PaginatedInvoicesDto,
  PaginatedPaymentsDto,
  BillingStatsDto,
  RazorpayOrderDto,
} from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  // ==================== Invoice Endpoints ====================

  @Post('invoices')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create a new invoice',
    description:
      'Generate invoice for patient services with line items, taxes, and insurance details',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invoice created successfully',
    type: InvoiceOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid invoice data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  async createInvoice(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Request() req: any,
  ): Promise<InvoiceOutputDto> {
    this.logger.log(
      `Creating invoice by user: ${req.user.userId} for patient: ${createInvoiceDto.patientId}`,
    );

    return this.billingService.createInvoice(createInvoiceDto);
  }

  @Get('invoices')
  @Roles(
    UserRole.DOCTOR,
    UserRole.PATIENT,
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get all invoices with filters',
    description:
      'Retrieve paginated list of invoices with optional filters (patient, doctor, hospital, status, date range)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoices retrieved successfully',
    type: PaginatedInvoicesDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getAllInvoices(@Query() filters: any, @Request() req: any): Promise<PaginatedInvoicesDto> {
    // Filter by patient if role is patient
    if (req.user.role === 'patient') {
      filters.patientId = req.user.userId;
    }

    // Filter by doctor if role is doctor
    if (req.user.role === 'doctor') {
      filters.doctorId = req.user.userId;
    }

    // Filter by hospital if role is hospital-admin
    if (req.user.role === 'hospital-admin') {
      filters.hospitalId = req.user.hospitalId;
    }

    return this.billingService.getAllInvoices(filters);
  }

  @Get('invoices/:id')
  @Roles(
    UserRole.DOCTOR,
    UserRole.PATIENT,
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get invoice details by ID',
    description: 'Retrieve complete invoice details including line items and payment history',
  })
  @ApiParam({ name: 'id', description: 'Invoice MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice retrieved successfully',
    type: InvoiceOutputDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invoice not found' })
  async getInvoiceById(@Param('id') id: string): Promise<InvoiceOutputDto> {
    return this.billingService.getInvoiceById(id);
  }

  @Get('invoices/number/:invoiceNumber')
  @Roles(
    UserRole.DOCTOR,
    UserRole.PATIENT,
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get invoice by invoice number',
    description: 'Retrieve invoice using human-readable invoice number (e.g., INV-2024-001234)',
  })
  @ApiParam({ name: 'invoiceNumber', description: 'Invoice number (format: INV-YYYY-NNNNNN)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice retrieved successfully',
    type: InvoiceOutputDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invoice not found' })
  async getInvoiceByNumber(
    @Param('invoiceNumber') invoiceNumber: string,
  ): Promise<InvoiceOutputDto> {
    return this.billingService.getInvoiceByNumber(invoiceNumber);
  }

  @Put('invoices/:id')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update invoice',
    description: 'Modify invoice details before payment (cannot update paid/cancelled invoices)',
  })
  @ApiParam({ name: 'id', description: 'Invoice MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice updated successfully',
    type: InvoiceOutputDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update or invoice already paid',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invoice not found' })
  async updateInvoice(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Request() req: any,
  ): Promise<InvoiceOutputDto> {
    this.logger.log(`Updating invoice ${id} by user: ${req.user.userId}`);

    return this.billingService.updateInvoice(id, updateInvoiceDto);
  }

  @Delete('invoices/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete invoice (soft delete)',
    description: 'Soft delete an invoice - Admin only (cannot delete paid invoices)',
  })
  @ApiParam({ name: 'id', description: 'Invoice MongoDB ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Invoice deleted successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot delete paid invoice' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invoice not found' })
  async deleteInvoice(@Param('id') id: string, @Request() req: any): Promise<void> {
    this.logger.log(`Deleting invoice ${id} by user: ${req.user.userId}`);

    await this.billingService.deleteInvoice(id);
  }

  @Post('invoices/:id/cancel')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Cancel invoice',
    description: 'Cancel an unpaid invoice with reason (cannot cancel paid/refunded invoices)',
  })
  @ApiParam({ name: 'id', description: 'Invoice MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice cancelled successfully',
    type: InvoiceOutputDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot cancel paid or cancelled invoice',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invoice not found' })
  async cancelInvoice(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ): Promise<InvoiceOutputDto> {
    this.logger.log(`Cancelling invoice ${id} by user: ${req.user.userId}`);

    return this.billingService.cancelInvoice(id, reason);
  }

  @Get('invoices/overdue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get overdue invoices',
    description: 'Retrieve all invoices past their due date with outstanding balance',
  })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Overdue invoices retrieved successfully',
    type: [InvoiceOutputDto],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin only' })
  async getOverdueInvoices(@Query('hospitalId') hospitalId?: string): Promise<InvoiceOutputDto[]> {
    return this.billingService.getOverdueInvoices(hospitalId);
  }

  // ==================== Payment Endpoints ====================

  @Post('payments')
  @Roles(
    UserRole.DOCTOR,
    UserRole.PATIENT,
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Create manual payment',
    description: 'Record manual payment (cash, insurance, bank transfer) for an invoice',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment recorded successfully',
    type: PaymentOutputDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid payment data or exceeds due amount',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invoice not found' })
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Request() req: any,
  ): Promise<PaymentOutputDto> {
    this.logger.log(
      `Recording manual payment by user: ${req.user.userId} for invoice: ${createPaymentDto.invoiceId}`,
    );

    return this.billingService.createPayment(createPaymentDto);
  }

  @Get('payments')
  @Roles(
    UserRole.DOCTOR,
    UserRole.PATIENT,
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get all payments with filters',
    description:
      'Retrieve paginated list of payments with optional filters (patient, hospital, status, method, date range)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payments retrieved successfully',
    type: PaginatedPaymentsDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getAllPayments(@Query() filters: any, @Request() req: any): Promise<PaginatedPaymentsDto> {
    // Filter by patient if role is patient
    if (req.user.role === 'patient') {
      filters.patientId = req.user.userId;
    }

    // Filter by hospital if role is hospital-admin
    if (req.user.role === 'hospital-admin') {
      filters.hospitalId = req.user.hospitalId;
    }

    return this.billingService.getAllPayments(filters);
  }

  @Get('payments/:id')
  @Roles(
    UserRole.DOCTOR,
    UserRole.PATIENT,
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get payment details by ID',
    description: 'Retrieve complete payment details including gateway response and refund info',
  })
  @ApiParam({ name: 'id', description: 'Payment MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment retrieved successfully',
    type: PaymentOutputDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Payment not found' })
  async getPaymentById(@Param('id') id: string): Promise<PaymentOutputDto> {
    return this.billingService.getPaymentById(id);
  }

  // ==================== Razorpay Payment Endpoints ====================

  @Post('payments/razorpay/create-order')
  @Roles(
    UserRole.PATIENT,
    UserRole.DOCTOR,
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Initiate Razorpay payment order',
    description: 'Create Razorpay order for online payment processing',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Razorpay order created successfully',
    type: RazorpayOrderDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid amount or invoice already paid',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invoice not found' })
  async initiateRazorpayPayment(
    @Body() dto: InitiateRazorpayPaymentDto,
    @Request() req: any,
  ): Promise<RazorpayOrderDto> {
    this.logger.log(
      `Initiating Razorpay payment by user: ${req.user.userId} for invoice: ${dto.invoiceId}`,
    );

    return this.billingService.initiateRazorpayPayment(dto);
  }

  @Post('payments/razorpay/verify')
  @Roles(
    UserRole.PATIENT,
    UserRole.DOCTOR,
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Verify and complete Razorpay payment',
    description: 'Verify payment signature and mark payment as completed',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment verified and completed successfully',
    type: PaymentOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid payment signature' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Payment record not found' })
  async verifyRazorpayPayment(
    @Body() dto: VerifyRazorpayPaymentDto,
    @Request() req: any,
  ): Promise<PaymentOutputDto> {
    this.logger.log(
      `Verifying Razorpay payment by user: ${req.user.userId} - Order: ${dto.razorpayOrderId}`,
    );

    return this.billingService.verifyRazorpayPayment(dto);
  }

  // ==================== Refund Endpoints ====================

  @Post('payments/:id/refund')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Process payment refund',
    description: 'Refund completed payment (full or partial) through payment gateway',
  })
  @ApiParam({ name: 'id', description: 'Payment MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Refund processed successfully',
    type: PaymentOutputDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payment not completed or already refunded',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Payment not found' })
  async processRefund(
    @Param('id') paymentId: string,
    @Body() refundDto: RefundPaymentDto,
    @Request() req: any,
  ): Promise<PaymentOutputDto> {
    this.logger.log(`Processing refund for payment ${paymentId} by user: ${req.user.userId}`);

    return this.billingService.processRefund(paymentId, refundDto);
  }

  // ==================== Insurance Claim Endpoints ====================

  @Post('invoices/:id/insurance-claim')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Submit insurance claim',
    description: 'Submit insurance claim for invoice to insurance provider',
  })
  @ApiParam({ name: 'id', description: 'Invoice MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Insurance claim submitted successfully',
    type: InvoiceOutputDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invoice has no insurance information',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invoice not found' })
  async submitInsuranceClaim(
    @Param('id') invoiceId: string,
    @Body() claimData: any,
    @Request() req: any,
  ): Promise<InvoiceOutputDto> {
    this.logger.log(
      `Submitting insurance claim for invoice ${invoiceId} by user: ${req.user.userId}`,
    );

    return this.billingService.submitInsuranceClaim(invoiceId, claimData);
  }

  // ==================== Statistics & Reports ====================

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get billing statistics',
    description:
      'Retrieve aggregated billing stats (total invoices, payments, revenue, pending amounts)',
  })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (ISO 8601)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Billing statistics retrieved successfully',
    type: BillingStatsDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin only' })
  async getBillingStats(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<BillingStatsDto> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.billingService.getBillingStats(hospitalId, start, end);
  }

  @Post('reminders/send')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Send payment reminders',
    description: 'Send payment reminder notifications for all overdue invoices',
  })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment reminders sent successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin only' })
  async sendPaymentReminders(@Query('hospitalId') hospitalId?: string): Promise<{ sent: number }> {
    this.logger.log('Sending payment reminders for overdue invoices');

    const sent = await this.billingService.sendPaymentReminders(hospitalId);

    return { sent };
  }

  // ==================== Receipt Endpoints ====================

  @Post('payments/:id/send-receipt')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send payment receipt via email',
    description: 'Send payment receipt to patient email',
  })
  @ApiParam({ name: 'id', description: 'Payment MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Receipt sent successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Payment not completed' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Payment not found' })
  async sendReceipt(
    @Param('id') paymentId: string,
    @Body() sendReceiptDto: SendReceiptDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    this.logger.log(`Sending receipt for payment ${paymentId} by user: ${req.user.userId}`);

    if (!sendReceiptDto.email) {
      throw new BadRequestException('Email is required');
    }

    await this.billingService.sendReceiptEmail(paymentId, sendReceiptDto.email);

    return {
      message: 'Receipt sent successfully to ' + sendReceiptDto.email,
    };
  }

  @Get('invoices/:id/download')
  @Roles(
    UserRole.DOCTOR,
    UserRole.PATIENT,
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Download invoice as PDF',
    description: 'Generate and download invoice PDF document',
  })
  @ApiParam({ name: 'id', description: 'Invoice MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice PDF generated successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invoice not found' })
  async downloadInvoice(@Param('id') id: string, @Res() res: Response): Promise<void> {
    this.logger.log(`Generating PDF for invoice ${id}`);

    const pdfBuffer = await this.billingService.generateInvoicePdf(id);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  }
}
