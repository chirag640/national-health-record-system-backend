import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Otp, OtpDocument, OtpPurpose } from './schemas/otp.schema';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;

  constructor(
    @InjectModel(Otp.name)
    private otpModel: Model<OtpDocument>,
  ) {}

  /**
   * Generate a 6-digit OTP
   */
  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Create and store OTP
   */
  async createOtp(
    email: string,
    purpose: OtpPurpose,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    // Delete any existing unused OTPs for this email and purpose
    await this.otpModel.deleteMany({
      email: email.toLowerCase(),
      purpose,
      isUsed: false,
    });

    // Generate OTP
    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    // Store OTP
    await this.otpModel.create({
      email: email.toLowerCase(),
      otpHash,
      purpose,
      expiresAt,
      ipAddress,
      userAgent,
    });

    this.logger.log(`OTP created for ${email} (${purpose})`);
    return otp;
  }

  /**
   * Verify OTP
   */
  async verifyOtp(email: string, otp: string, purpose: OtpPurpose): Promise<boolean> {
    const normalizedEmail = email.toLowerCase();

    // Find valid OTP
    const otpDoc = await this.otpModel
      .findOne({
        email: normalizedEmail,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 });

    if (!otpDoc) {
      throw new BadRequestException({
        code: 'OTP_INVALID_OR_EXPIRED',
        message: 'OTP is invalid or has expired. Please request a new one.',
      });
    }

    // Check max attempts
    if (otpDoc.attempts >= this.MAX_ATTEMPTS) {
      throw new BadRequestException({
        code: 'OTP_MAX_ATTEMPTS_EXCEEDED',
        message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.',
      });
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, otpDoc.otpHash);

    if (!isValid) {
      // Increment attempts
      otpDoc.attempts += 1;
      await otpDoc.save();

      throw new BadRequestException({
        code: 'OTP_INCORRECT',
        message: `Incorrect OTP. ${this.MAX_ATTEMPTS - otpDoc.attempts} attempts remaining.`,
      });
    }

    // Mark as used
    otpDoc.isUsed = true;
    otpDoc.usedAt = new Date();
    await otpDoc.save();

    this.logger.log(`OTP verified for ${email} (${purpose})`);
    return true;
  }

  /**
   * Check if OTP exists and is valid (without verifying)
   */
  async isOtpValid(email: string, purpose: OtpPurpose): Promise<boolean> {
    const otpDoc = await this.otpModel.findOne({
      email: email.toLowerCase(),
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    return !!otpDoc;
  }

  /**
   * Delete OTP
   */
  async deleteOtp(email: string, purpose: OtpPurpose): Promise<void> {
    await this.otpModel.deleteMany({
      email: email.toLowerCase(),
      purpose,
    });
  }

  /**
   * Clean up expired OTPs (optional - TTL index handles this)
   */
  async cleanupExpiredOtps(): Promise<number> {
    const result = await this.otpModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    this.logger.log(`Cleaned up ${result.deletedCount} expired OTPs`);
    return result.deletedCount || 0;
  }
}
