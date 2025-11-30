import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Schema as MongooseSchema } from 'mongoose';

export type PatientDocument = Patient & MongooseDocument;

@Schema({ timestamps: true })
export class Patient {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  guid!: string;

  @Prop({
    type: String,
    required: true,
  })
  fullName!: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  phone!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other'],
  })
  gender!: string;

  @Prop({
    type: Date,
    required: false,
  })
  dateOfBirth!: Date;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: false,
  })
  address!: Record<string, any>;

  @Prop({
    type: [String],
    required: false,
  })
  allergies!: string[];

  @Prop({
    type: [String],
    required: false,
  })
  chronicDiseases!: string[];

  @Prop({
    type: String,
    required: false,
  })
  bloodGroup!: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: false,
  })
  emergencyContact!: Record<string, any>;

  @Prop({
    type: Boolean,
    required: false,
    default: false,
  })
  hasSmartphone!: boolean;

  @Prop({
    type: Boolean,
    required: false,
    default: false,
  })
  idCardIssued!: boolean;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);

// Compound indexes for common query patterns
// Index for sorting by creation date (most common query pattern)
PatientSchema.index({ createdAt: -1 });

// Compound index for unique field lookups with timestamps
PatientSchema.index({ guid: 1, createdAt: -1 });
