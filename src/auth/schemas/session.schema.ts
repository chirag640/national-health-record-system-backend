import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  sessionId!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  refreshTokenHash!: string;

  @Prop({
    type: String,
    required: true,
  })
  family!: string;

  @Prop({
    type: Date,
    required: true,
    index: true,
  })
  expiresAt!: Date;

  @Prop({
    type: Boolean,
    default: false,
  })
  isRevoked!: boolean;

  @Prop({
    type: Date,
    required: false,
  })
  revokedAt?: Date;

  @Prop({
    type: Date,
    required: false,
  })
  lastUsedAt?: Date;

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

  @Prop({
    type: String,
    required: false,
  })
  deviceInfo?: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// TTL index for automatic cleanup
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes
SessionSchema.index({ userId: 1, family: 1 });
SessionSchema.index({ userId: 1, isRevoked: 1 });
SessionSchema.index({ sessionId: 1, isRevoked: 1 });
