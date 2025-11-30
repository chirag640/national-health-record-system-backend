import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type HealthDocumentDocument = HealthDocument & MongooseDocument;

@Schema({ timestamps: true })
export class HealthDocument {
  // Relationship: Patient → Document (One-to-Many)
  // One patient can have many health documents (reports, scans, prescriptions)
  @Prop({
    type: String,
    required: true,
    index: true,
    ref: 'Patient',
  })
  patientId!: string;

  // Relationship: Hospital → Document (One-to-Many)
  // Hospital that issued/uploaded the document
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Hospital',
  })
  hospitalId!: Types.ObjectId;

  // Relationship: Encounter → Document (One-to-Many)
  // Link document to specific encounter/visit (optional)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    index: true,
    ref: 'Encounter',
  })
  encounterId?: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  docType!: string;

  @Prop({
    type: String,
    required: true,
  })
  fileUrl!: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: false,
  })
  metadata!: Record<string, any>;
}

export const HealthDocumentSchema = SchemaFactory.createForClass(HealthDocument);

// Compound indexes for common query patterns
// Index for sorting by creation date (most common query pattern)
HealthDocumentSchema.index({ createdAt: -1 });

// Patient-centric queries: Get all documents for a patient
HealthDocumentSchema.index({ patientId: 1, createdAt: -1 });

// Hospital-centric queries: Get all documents issued by hospital
HealthDocumentSchema.index({ hospitalId: 1, createdAt: -1 });

// Encounter-specific documents: Get all docs from an encounter
HealthDocumentSchema.index({ encounterId: 1, createdAt: -1 });

// Document type filtering: Get specific document types for patient
HealthDocumentSchema.index({ patientId: 1, docType: 1, createdAt: -1 });

// Audit trail: Patient documents at specific hospital
HealthDocumentSchema.index({ patientId: 1, hospitalId: 1, createdAt: -1 });
