import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  PATIENT = 'Patient',
  DOCTOR = 'Doctor',
  HOSPITAL_ADMIN = 'HospitalAdmin',
  SUPER_ADMIN = 'SuperAdmin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({
    type: String,
    required: true,
  })
  passwordHash!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(UserRole),
    index: true,
  })
  role!: UserRole;

  @Prop({
    type: Boolean,
    default: false,
    index: true,
  })
  emailVerified!: boolean;

  @Prop({
    type: String,
    required: false,
  })
  emailVerificationToken?: string;

  @Prop({
    type: Date,
    required: false,
  })
  emailVerificationExpiry?: Date;

  // Reference to Patient document (for Patient role)
  @Prop({
    type: String,
    required: false,
    ref: 'Patient',
    index: true,
  })
  patientId?: string;

  // Reference to Doctor document (for Doctor role)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    ref: 'Doctor',
    index: true,
  })
  doctorId?: Types.ObjectId;

  // Reference to Hospital (for Doctor and HospitalAdmin roles)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    ref: 'Hospital',
    index: true,
  })
  hospitalId?: Types.ObjectId;

  @Prop({
    type: String,
    required: false,
  })
  fullName?: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive!: boolean;

  @Prop({
    type: Date,
    required: false,
  })
  lastLoginAt?: Date;

  @Prop({
    type: String,
    required: false,
  })
  passwordResetToken?: string;

  @Prop({
    type: Date,
    required: false,
  })
  passwordResetExpiry?: Date;

  @Prop({
    type: Number,
    default: 0,
  })
  loginAttempts!: number;

  @Prop({
    type: Date,
    required: false,
  })
  lockUntil?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound indexes for common query patterns
UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ hospitalId: 1, role: 1 });
UserSchema.index({ emailVerified: 1, isActive: 1 });

// Virtual for checking if account is locked
UserSchema.virtual('isLocked').get(function (this: UserDocument) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Ensure virtuals are included in JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });
