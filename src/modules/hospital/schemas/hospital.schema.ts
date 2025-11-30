import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument } from 'mongoose';

export type HospitalDocument = Hospital & MongooseDocument;

@Schema({ timestamps: true })
export class Hospital {
  @Prop({
    type: String,
    required: true,
  })
  name!: string;

  @Prop({
    type: String,
    required: true,
  })
  state!: string;

  @Prop({
    type: String,
    required: true,
  })
  district!: string;

  @Prop({
    type: String,
    required: true,
    default: 'Government',
    enum: ['Government', 'Private'],
  })
  hospitalType!: string;

  @Prop({
    type: Boolean,
    required: false,
    default: true,
  })
  isActive!: boolean;
}

export const HospitalSchema = SchemaFactory.createForClass(Hospital);

// Compound indexes for common query patterns
// Index for sorting by creation date (most common query pattern)
HospitalSchema.index({ createdAt: -1 });

// Text search index for common search queries
HospitalSchema.index({ name: 'text' });
