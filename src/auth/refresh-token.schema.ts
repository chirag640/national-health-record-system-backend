import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  tokenHash!: string;

  @Prop({ required: true })
  family!: string; // Token family for rotation tracking

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: false })
  isRevoked!: boolean;

  @Prop()
  revokedAt?: Date;

  @Prop()
  lastUsedAt?: Date;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Index for cleanup
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ userId: 1, family: 1 });
