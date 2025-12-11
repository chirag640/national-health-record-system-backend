import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Schema as MongooseSchema } from 'mongoose';
import { NotificationType, NotificationChannel } from './notification.schema';

export type NotificationPreferenceDocument = NotificationPreference & MongooseDocument;

/**
 * Channel Preference - per notification type
 */
@Schema({ _id: false })
export class ChannelPreference {
  @Prop({
    required: true,
    enum: Object.values(NotificationChannel),
  })
  channel!: NotificationChannel;

  @Prop({ required: true, default: true })
  enabled!: boolean;
}

export const ChannelPreferenceSchema = SchemaFactory.createForClass(ChannelPreference);

/**
 * Type Preference - settings for each notification type
 */
@Schema({ _id: false })
export class TypePreference {
  @Prop({
    required: true,
    enum: Object.values(NotificationType),
  })
  type!: NotificationType;

  @Prop({ required: true, default: true })
  enabled!: boolean;

  @Prop({ type: [ChannelPreferenceSchema], default: [] })
  channels?: ChannelPreference[];
}

export const TypePreferenceSchema = SchemaFactory.createForClass(TypePreference);

/**
 * Quiet Hours Configuration
 */
@Schema({ _id: false })
export class QuietHours {
  @Prop({ required: true, default: false })
  enabled!: boolean;

  @Prop({ default: '22:00' }) // 10 PM
  startTime?: string;

  @Prop({ default: '08:00' }) // 8 AM
  endTime?: string;

  @Prop({ type: [String], default: [] })
  excludeTypes?: NotificationType[]; // Types that ignore quiet hours (e.g., critical alerts)
}

export const QuietHoursSchema = SchemaFactory.createForClass(QuietHours);

/**
 * Notification Preference Schema - User-specific notification settings
 */
@Schema({
  timestamps: true,
  collection: 'notification_preferences',
})
export class NotificationPreference {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId!: MongooseSchema.Types.ObjectId;

  // Global Settings
  @Prop({ default: true })
  enabled!: boolean; // Master switch for all notifications

  @Prop({
    type: [String],
    enum: Object.values(NotificationChannel),
    default: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  })
  preferredChannels!: NotificationChannel[];

  // Type-specific preferences
  @Prop({ type: [TypePreferenceSchema], default: [] })
  typePreferences!: TypePreference[];

  // Quiet Hours
  @Prop({ type: QuietHoursSchema, default: () => ({ enabled: false }) })
  quietHours!: QuietHours;

  // Frequency Settings
  @Prop({ default: false })
  enableDigest?: boolean; // Batch notifications into digest

  @Prop({
    enum: ['daily', 'weekly'],
    default: 'daily',
  })
  digestFrequency?: string;

  @Prop()
  digestTime?: string; // e.g., '09:00'

  // Grouping
  @Prop({ default: true })
  enableGrouping?: boolean; // Group similar notifications

  @Prop({ default: 5 })
  groupingThreshold?: number; // Min notifications to group

  // Language & Timezone
  @Prop({ default: 'en' })
  language?: string;

  @Prop({ default: 'Asia/Kolkata' })
  timezone?: string;

  // Contact Information
  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop({ type: [String], default: [] })
  deviceTokens?: string[]; // FCM/APNS tokens

  // Metadata
  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  // Soft delete
  @Prop({ default: false })
  isDeleted?: boolean;

  @Prop()
  deletedAt?: Date;
}

export const NotificationPreferenceSchema = SchemaFactory.createForClass(NotificationPreference);

// Note: Soft delete fields (isDeleted, deletedAt) already defined in schema, no plugin needed

// Indexes
NotificationPreferenceSchema.index({ userId: 1 }, { unique: true });
NotificationPreferenceSchema.index({ email: 1 });
NotificationPreferenceSchema.index({ phone: 1 });
