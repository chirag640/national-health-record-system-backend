import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ConsentDocument = Consent & MongooseDocument;

@Schema({ timestamps: true })
export class Consent {
  // Relationship: Patient → Consent (One-to-Many)
  // One patient can issue many consents to different doctors/hospitals
  @Prop({
    type: String,
    required: true,
    index: true,
    ref: 'Patient',
  })
  patientId!: string;

  // Relationship: Doctor → Consent (One-to-Many)
  // One doctor can receive consents from many patients (optional)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    index: true,
    ref: 'Doctor',
  })
  doctorId?: Types.ObjectId;

  // Optional: Hospital-level consent
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    index: true,
    ref: 'Hospital',
  })
  hospitalId?: Types.ObjectId;

  @Prop({
    type: [String],
    required: true,
  })
  scope!: string[];

  @Prop({
    type: Date,
    required: true,
    index: true,
  })
  expiresAt!: Date;

  @Prop({
    type: Boolean,
    required: false,
    default: true,
  })
  isActive!: boolean;
}

export const ConsentSchema = SchemaFactory.createForClass(Consent);

// Compound indexes for common query patterns
// Index for sorting by creation date (most common query pattern)
ConsentSchema.index({ createdAt: -1 });

// Patient-centric queries: Get all consents issued by patient
ConsentSchema.index({ patientId: 1, createdAt: -1 });

// Doctor-centric queries: Get all consents granted to doctor
ConsentSchema.index({ doctorId: 1, createdAt: -1 });

// Active consents: Filter by expiry and active status
ConsentSchema.index({ patientId: 1, isActive: 1, expiresAt: 1 });
ConsentSchema.index({ doctorId: 1, isActive: 1, expiresAt: 1 });

// Permission check: Patient-Doctor consent lookup
ConsentSchema.index({ patientId: 1, doctorId: 1, isActive: 1, expiresAt: 1 });

// Hospital-wide consents
ConsentSchema.index({ patientId: 1, hospitalId: 1, isActive: 1, expiresAt: 1 });
