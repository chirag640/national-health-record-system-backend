import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

export enum OtpPurpose {
  EMAIL_VERIFICATION = 'email_verification',
  LOGIN = 'login',
  PASSWORD_RESET = 'password_reset',
  MFA = 'mfa',
  EMERGENCY_ACCESS = 'emergency_access',
}

@Schema({ timestamps: true })
export class Otp {
  @Prop({
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({
    type: String,
    required: true,
  })
  otpHash!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(OtpPurpose),
  })
  purpose!: OtpPurpose;

  @Prop({
    type: Date,
    required: true,
  })
  expiresAt!: Date;

  @Prop({
    type: Boolean,
    default: false,
  })
  isUsed!: boolean;

  @Prop({
    type: Date,
    required: false,
  })
  usedAt?: Date;

  @Prop({
    type: Number,
    default: 0,
  })
  attempts!: number;

  @Prop({
    type: String,
    required: false,
  })
  ipAddress?: string;

  @Prop({
    type: String,
    required: false,
  })
  userAgent?: string;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// TTL index - auto delete expired OTPs
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for verification
OtpSchema.index({ email: 1, purpose: 1, isUsed: 1 });
OtpSchema.index({ email: 1, expiresAt: 1 });
