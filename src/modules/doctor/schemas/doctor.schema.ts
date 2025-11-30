import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type DoctorDocument = Doctor & MongooseDocument;

@Schema({ timestamps: true })
export class Doctor {
  // Relationship: Hospital → Doctor (One-to-Many)
  // One hospital has many doctors
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Hospital',
  })
  hospitalId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  fullName!: string;

  @Prop({
    type: String,
    required: true,
  })
  phone!: string;

  @Prop({
    type: String,
    required: false,
  })
  specialization!: string;

  @Prop({
    type: String,
    required: false,
  })
  licenseNumber!: string;

  @Prop({
    type: Boolean,
    required: false,
    default: true,
  })
  isActive!: boolean;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);

// Compound indexes for common query patterns
// Index for sorting by creation date (most common query pattern)
DoctorSchema.index({ createdAt: -1 });

// Hospital-centric queries: Get all doctors at a hospital
DoctorSchema.index({ hospitalId: 1, createdAt: -1 });

// Filter active doctors by hospital
DoctorSchema.index({ hospitalId: 1, isActive: 1 });

// Search doctors by specialization at hospital
DoctorSchema.index({ hospitalId: 1, specialization: 1 });

// Phone lookup for authentication
DoctorSchema.index({ phone: 1 }, { unique: true });
