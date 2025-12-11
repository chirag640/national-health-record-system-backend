import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: any;
  created_at: number;
}

export interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
  captured: boolean;
  email: string;
  contact: string;
  fee?: number;
  tax?: number;
  error_code?: string;
  error_description?: string;
  created_at: number;
}

export interface RazorpayRefund {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  notes: any;
  receipt?: string;
  status: string;
  speed_requested: string;
  speed_processed: string;
  created_at: number;
}

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private razorpayInstance: Razorpay;
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID') || '';
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') || '';

    if (!this.keyId || !this.keySecret) {
      this.logger.error('Razorpay credentials not configured');
      throw new Error('Razorpay credentials are missing in environment variables');
    }

    this.razorpayInstance = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });

    this.logger.log('Razorpay service initialized successfully');
  }

  /**
   * Get Razorpay key ID for frontend
   */
  getKeyId(): string {
    return this.keyId;
  }

  /**
   * Create a Razorpay order
   */
  async createOrder(
    amount: number,
    currency: string = 'INR',
    receipt: string,
    notes?: any,
  ): Promise<RazorpayOrder> {
    try {
      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt,
        notes: notes || {},
      };

      this.logger.log(`Creating Razorpay order: ${JSON.stringify(options)}`);

      const order = await this.razorpayInstance.orders.create(options);

      this.logger.log(`Razorpay order created: ${order.id}`);

      return order as RazorpayOrder;
    } catch (error: any) {
      this.logger.error(`Failed to create Razorpay order: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create payment order: ${error.message}`);
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    try {
      const text = `${orderId}|${paymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(text)
        .digest('hex');

      const isValid = generatedSignature === signature;

      if (isValid) {
        this.logger.log(`Payment signature verified successfully for order: ${orderId}`);
      } else {
        this.logger.warn(`Invalid payment signature for order: ${orderId}`);
      }

      return isValid;
    } catch (error: any) {
      this.logger.error(`Error verifying payment signature: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Fetch payment details from Razorpay
   */
  async fetchPayment(paymentId: string): Promise<RazorpayPayment> {
    try {
      this.logger.log(`Fetching payment details for: ${paymentId}`);

      const payment = await this.razorpayInstance.payments.fetch(paymentId);

      return payment as RazorpayPayment;
    } catch (error: any) {
      this.logger.error(`Failed to fetch payment: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to fetch payment details: ${error.message}`);
    }
  }

  /**
   * Capture a payment (for manual capture mode)
   */
  async capturePayment(
    paymentId: string,
    amount: number,
    currency: string = 'INR',
  ): Promise<RazorpayPayment> {
    try {
      this.logger.log(`Capturing payment: ${paymentId} for amount: ${amount}`);

      const payment = await this.razorpayInstance.payments.capture(
        paymentId,
        Math.round(amount * 100), // Convert to paise
        currency,
      );

      this.logger.log(`Payment captured successfully: ${paymentId}`);

      return payment as RazorpayPayment;
    } catch (error: any) {
      this.logger.error(`Failed to capture payment: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to capture payment: ${error.message}`);
    }
  }

  /**
   * Initiate a refund
   */
  async createRefund(paymentId: string, amount?: number, notes?: any): Promise<RazorpayRefund> {
    try {
      const options: any = {
        notes: notes || {},
      };

      if (amount) {
        options.amount = Math.round(amount * 100); // Convert to paise (partial refund)
      }

      this.logger.log(`Creating refund for payment: ${paymentId}`);

      const refund = await this.razorpayInstance.payments.refund(paymentId, options);

      this.logger.log(`Refund created successfully: ${refund.id}`);

      return refund as RazorpayRefund;
    } catch (error: any) {
      this.logger.error(`Failed to create refund: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Fetch refund details
   */
  async fetchRefund(paymentId: string, refundId: string): Promise<RazorpayRefund> {
    try {
      this.logger.log(`Fetching refund: ${refundId} for payment: ${paymentId}`);

      const refund = await this.razorpayInstance.payments.fetchRefund(paymentId, refundId);

      return refund as RazorpayRefund;
    } catch (error: any) {
      this.logger.error(`Failed to fetch refund: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to fetch refund details: ${error.message}`);
    }
  }

  /**
   * Fetch all refunds for a payment
   */
  async fetchAllRefunds(paymentId: string): Promise<RazorpayRefund[]> {
    try {
      this.logger.log(`Fetching all refunds for payment: ${paymentId}`);

      const refunds = await this.razorpayInstance.payments.fetchMultipleRefund(paymentId);

      return refunds.items as RazorpayRefund[];
    } catch (error: any) {
      this.logger.error(`Failed to fetch refunds: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to fetch refunds: ${error.message}`);
    }
  }

  /**
   * Fetch order details
   */
  async fetchOrder(orderId: string): Promise<RazorpayOrder> {
    try {
      this.logger.log(`Fetching order details for: ${orderId}`);

      const order = await this.razorpayInstance.orders.fetch(orderId);

      return order as RazorpayOrder;
    } catch (error: any) {
      this.logger.error(`Failed to fetch order: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to fetch order details: ${error.message}`);
    }
  }

  /**
   * Fetch all payments for an order
   */
  async fetchOrderPayments(orderId: string): Promise<RazorpayPayment[]> {
    try {
      this.logger.log(`Fetching payments for order: ${orderId}`);

      const payments = await this.razorpayInstance.orders.fetchPayments(orderId);

      return payments.items as RazorpayPayment[];
    } catch (error: any) {
      this.logger.error(`Failed to fetch order payments: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to fetch order payments: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      if (!this.webhookSecret) {
        this.logger.warn('Webhook secret not configured, skipping verification');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      const isValid = expectedSignature === signature;

      if (isValid) {
        this.logger.log('Webhook signature verified successfully');
      } else {
        this.logger.warn('Invalid webhook signature');
      }

      return isValid;
    } catch (error: any) {
      this.logger.error(`Error verifying webhook signature: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Generate payment link
   */
  async createPaymentLink(
    amount: number,
    currency: string = 'INR',
    description: string,
    customer: {
      name: string;
      email: string;
      contact: string;
    },
    notes?: any,
  ): Promise<any> {
    try {
      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        description,
        customer,
        notify: {
          sms: true,
          email: true,
        },
        reminder_enable: true,
        notes: notes || {},
      };

      this.logger.log(`Creating payment link for customer: ${customer.email}`);

      const paymentLink = await this.razorpayInstance.paymentLink.create(options);

      this.logger.log(`Payment link created: ${paymentLink.id}`);

      return paymentLink;
    } catch (error: any) {
      this.logger.error(`Failed to create payment link: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create payment link: ${error.message}`);
    }
  }

  /**
   * Validate VPA (Virtual Payment Address) for UPI
   */
  async validateVPA(vpa: string): Promise<boolean> {
    try {
      this.logger.log(`Validating VPA: ${vpa}`);

      // Razorpay doesn't have a direct VPA validation API
      // This is a basic format validation
      const vpaRegex = /^[\w.-]+@[\w.-]+$/;
      const isValid = vpaRegex.test(vpa);

      if (isValid) {
        this.logger.log(`VPA format is valid: ${vpa}`);
      } else {
        this.logger.warn(`Invalid VPA format: ${vpa}`);
      }

      return isValid;
    } catch (error: any) {
      this.logger.error(`Error validating VPA: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Get payment methods available
   */
  getAvailablePaymentMethods(): string[] {
    return [
      'card', // Credit/Debit cards
      'netbanking', // Net banking
      'wallet', // Wallets (Paytm, PhonePe, etc.)
      'upi', // UPI
      'emi', // EMI options
      'cardless_emi', // Cardless EMI
      'paylater', // Pay later options
    ];
  }

  /**
   * Format amount to Razorpay format (paise)
   */
  toRazorpayAmount(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Format amount from Razorpay format (paise to rupees)
   */
  fromRazorpayAmount(amount: number): number {
    return amount / 100;
  }
}
