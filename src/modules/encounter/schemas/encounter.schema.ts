import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type EncounterDocument = Encounter & MongooseDocument;

@Schema({ timestamps: true })
export class Encounter {
  // Relationship: Patient → Encounter (One-to-Many)
  // One patient can have many encounters (visits)
  @Prop({
    type: String,
    required: true,
    index: true,
    ref: 'Patient',
  })
  patientId!: string;

  // Relationship: Doctor → Encounter (One-to-Many)
  // One doctor can attend many encounters
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Doctor',
  })
  doctorId!: Types.ObjectId;

  // Relationship: Hospital → Encounter (One-to-Many)
  // One hospital handles many encounters
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
  visitReason!: string;

  @Prop({
    type: String,
    required: false,
  })
  diagnosis!: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: false,
  })
  prescriptions!: Record<string, any>;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: false,
  })
  vitals!: Record<string, any>;
}

export const EncounterSchema = SchemaFactory.createForClass(Encounter);

// Compound indexes for common query patterns
// Index for sorting by creation date (most common query pattern)
EncounterSchema.index({ createdAt: -1 });

// Patient-centric queries: Get all encounters for a patient
EncounterSchema.index({ patientId: 1, createdAt: -1 });

// Doctor-centric queries: Get all encounters by doctor
EncounterSchema.index({ doctorId: 1, createdAt: -1 });

// Hospital-centric queries: Get all encounters at hospital
EncounterSchema.index({ hospitalId: 1, createdAt: -1 });

// Analytics: Hospital + Doctor load distribution
EncounterSchema.index({ hospitalId: 1, doctorId: 1, createdAt: -1 });

// Audit trail: Patient encounters at specific hospital
EncounterSchema.index({ patientId: 1, hospitalId: 1, createdAt: -1 });
