import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = AuditLog & MongooseDocument;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({
    type: String,
    required: false,
  })
  userId!: string;

  @Prop({
    type: String,
    required: true,
  })
  action!: string;

  @Prop({
    type: String,
    required: true,
  })
  resource!: string;

  @Prop({
    type: String,
    required: true,
  })
  resourceId!: string;

  @Prop({
    type: String,
    required: false,
  })
  ipAddress!: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: false,
  })
  details!: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Compound indexes for common query patterns
// Index for sorting by creation date (most common query pattern)
AuditLogSchema.index({ createdAt: -1 });
