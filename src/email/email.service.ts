import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

export interface SendEmailVerificationOptions {
  to: string;
  name: string;
  verificationToken: string;
}

export interface SendPasswordResetOptions {
  to: string;
  name: string;
  resetToken: string;
}

export interface SendWelcomeEmailOptions {
  to: string;
  name: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  /**
   * Send a generic email using a template
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context,
      });

      this.logger.log(`Email sent successfully to ${options.to} (template: ${options.template})`);
    } catch (error: any) {
      const err = error as Error;
      this.logger.error(`Failed to send email to ${options.to}:`, err.message, err.stack);
      throw new Error(`Email sending failed: ${err.message}`);
    }
  }

  /**
   * Send email verification link
   */
  async sendEmailVerification(options: SendEmailVerificationOptions): Promise<void> {
    const verificationUrl = `${this.frontendUrl}/auth/verify-email?token=${options.verificationToken}`;

    await this.sendEmail({
      to: options.to,
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      context: {
        name: options.name,
        verificationUrl,
        validityHours: 24,
      },
    });
  }

  /**
   * Send password reset link
   */
  async sendPasswordReset(options: SendPasswordResetOptions): Promise<void> {
    const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${options.resetToken}`;

    await this.sendEmail({
      to: options.to,
      subject: 'Reset Your Password',
      template: 'password-reset',
      context: {
        name: options.name,
        resetUrl,
        validityHours: 1,
      },
    });
  }

  /**
   * Send OTP via email
   */
  async sendOtp(
    email: string,
    name: string,
    otp: string,
    expiryMinutes: number = 5,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Your Verification Code',
      template: 'otp-verification',
      context: {
        name,
        otp,
        expiryMinutes,
      },
    });
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(options: SendWelcomeEmailOptions): Promise<void> {
    await this.sendEmail({
      to: options.to,
      subject: 'Welcome to national-health-record-system!',
      template: 'welcome',
      context: {
        name: options.name,
        loginUrl: `${this.frontendUrl}/auth/login`,
        supportEmail: this.configService.get<string>(
          'SUPPORT_EMAIL',
          'support@national-health-record-system.com',
        ),
      },
    });
  }

  /**
   * Send notification email (can be extended for various notifications)
   */
  async sendNotification(to: string, subject: string, message: string): Promise<void> {
    await this.sendEmail({
      to,
      subject,
      template: 'notification',
      context: {
        subject,
        message,
      },
    });
  }
}
