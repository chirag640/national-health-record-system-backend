import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

/**
 * SMS Service using Twilio
 * Handles SMS notifications
 */
@Injectable()
export class SmsService implements OnModuleInit {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio | null = null;
  private fromPhoneNumber: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initializeTwilio();
  }

  /**
   * Initialize Twilio client
   */
  private initializeTwilio() {
    try {
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      this.fromPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || null;

      if (!accountSid || !authToken || !this.fromPhoneNumber) {
        this.logger.warn(
          'Twilio credentials not configured. SMS notifications will not work. ' +
            'Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.',
        );
        return;
      }

      this.twilioClient = new Twilio(accountSid, authToken);
      this.logger.log('Twilio client initialized successfully');
    } catch (error: any) {
      this.logger.error('Failed to initialize Twilio client:', error);
      this.twilioClient = null;
    }
  }

  /**
   * Send SMS to a single phone number
   */
  async sendSms(
    to: string,
    message: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.twilioClient || !this.fromPhoneNumber) {
      this.logger.warn('Twilio not initialized. Skipping SMS.');
      return { success: false, error: 'Twilio not configured' };
    }

    try {
      // Ensure phone number has country code
      const formattedTo = this.formatPhoneNumber(to);

      const response = await this.twilioClient.messages.create({
        body: message,
        from: this.fromPhoneNumber,
        to: formattedTo,
      });

      this.logger.log(`SMS sent successfully to ${formattedTo}. SID: ${response.sid}`);

      return { success: true, messageId: response.sid };
    } catch (error: any) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send SMS to multiple phone numbers
   */
  async sendBulkSms(recipients: Array<{ phone: string; message: string }>): Promise<{
    success: boolean;
    successCount: number;
    failureCount: number;
    results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }>;
  }> {
    if (!this.twilioClient || !this.fromPhoneNumber) {
      this.logger.warn('Twilio not initialized. Skipping bulk SMS.');
      return {
        success: false,
        successCount: 0,
        failureCount: recipients.length,
        results: recipients.map((r) => ({
          phone: r.phone,
          success: false,
          error: 'Twilio not configured',
        })),
      };
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const recipient of recipients) {
      try {
        const formattedPhone = this.formatPhoneNumber(recipient.phone);

        const response = await this.twilioClient.messages.create({
          body: recipient.message,
          from: this.fromPhoneNumber,
          to: formattedPhone,
        });

        results.push({
          phone: recipient.phone,
          success: true,
          messageId: response.sid,
        });
        successCount++;

        this.logger.log(`SMS sent to ${formattedPhone}. SID: ${response.sid}`);
      } catch (error: any) {
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? String(error.message)
            : 'Unknown error';

        results.push({
          phone: recipient.phone,
          success: false,
          error: errorMessage,
        });
        failureCount++;

        this.logger.error(`Failed to send SMS to ${recipient.phone}:`, error);
      }

      // Add small delay to avoid rate limiting
      await this.delay(100);
    }

    this.logger.log(
      `Bulk SMS completed. Success: ${successCount}, Failure: ${failureCount} out of ${recipients.length}`,
    );

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      results,
    };
  }

  /**
   * Send OTP SMS
   */
  async sendOtp(
    to: string,
    otp: string,
    expiryMinutes: number = 10,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message =
      `Your OTP for National Health Record System is: ${otp}\n` +
      `This OTP will expire in ${expiryMinutes} minutes.\n` +
      `Do not share this OTP with anyone.`;

    return this.sendSms(to, message);
  }

  /**
   * Send appointment reminder SMS
   */
  async sendAppointmentReminder(
    to: string,
    appointmentDetails: {
      patientName: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
      hospitalName: string;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message =
      `Hello ${appointmentDetails.patientName},\n` +
      `Reminder: You have an appointment with Dr. ${appointmentDetails.doctorName}\n` +
      `Date: ${appointmentDetails.appointmentDate}\n` +
      `Time: ${appointmentDetails.appointmentTime}\n` +
      `Location: ${appointmentDetails.hospitalName}\n` +
      `Please arrive 10 minutes early.`;

    return this.sendSms(to, message);
  }

  /**
   * Send prescription expiry reminder SMS
   */
  async sendPrescriptionReminder(
    to: string,
    prescriptionDetails: {
      patientName: string;
      medicationName: string;
      expiryDate: string;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message =
      `Hello ${prescriptionDetails.patientName},\n` +
      `Your prescription for ${prescriptionDetails.medicationName} will expire on ${prescriptionDetails.expiryDate}.\n` +
      `Please consult your doctor for renewal.`;

    return this.sendSms(to, message);
  }

  /**
   * Format phone number to E.164 format
   * Example: +919876543210
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If it doesn't start with country code, assume India (+91)
    if (!cleaned.startsWith('91') && !cleaned.startsWith('+91')) {
      cleaned = '91' + cleaned;
    }

    // Add + prefix if not present
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if Twilio is initialized
   */
  isInitialized(): boolean {
    return this.twilioClient !== null;
  }
}
