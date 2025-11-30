import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument } from 'mongoose';

export type SyncQueueDocument = SyncQueue & MongooseDocument;

/**
 * Sync Queue Schema
 * Tracks offline operations that need to be synced to server
 */
@Schema({ timestamps: true })
export class SyncQueue {
  @Prop({
    type: String,
    required: true,
    index: true,
  })
  userId!: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  deviceId!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE'],
  })
  operation!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['patient', 'doctor', 'encounter', 'consent', 'health-document'],
  })
  resourceType!: string;

  @Prop({
    type: String,
    required: false,
  })
  resourceId?: string;

  @Prop({
    type: Object,
    required: true,
  })
  data!: Record<string, any>;

  @Prop({
    type: String,
    required: true,
    default: 'PENDING',
    enum: ['PENDING', 'SYNCED', 'FAILED', 'CONFLICT'],
    index: true,
  })
  status!: string;

  @Prop({
    type: Number,
    required: true,
    default: 0,
  })
  retryCount!: number;

  @Prop({
    type: String,
    required: false,
  })
  errorMessage?: string;

  @Prop({
    type: Date,
    required: false,
  })
  syncedAt?: Date;

  @Prop({
    type: Date,
    required: true,
    index: true,
  })
  createdAtClient!: Date;

  @Prop({
    type: Number,
    required: true,
    default: 1,
  })
  version!: number;

  @Prop({
    type: String,
    required: false,
  })
  conflictResolution?: string;
}

export const SyncQueueSchema = SchemaFactory.createForClass(SyncQueue);

// Indexes for sync operations
SyncQueueSchema.index({ userId: 1, status: 1, createdAtClient: 1 });
SyncQueueSchema.index({ deviceId: 1, status: 1 });
SyncQueueSchema.index({ resourceType: 1, resourceId: 1, createdAtClient: -1 });

// TTL index to auto-delete synced items after 30 days
SyncQueueSchema.index({ syncedAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
