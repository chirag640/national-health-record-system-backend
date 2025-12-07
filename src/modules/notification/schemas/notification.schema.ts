import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & MongooseDocument;

/**
 * Notification Type - categorizes the purpose of the notification
 */
export enum NotificationType {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',

  PRESCRIPTION_EXPIRING = 'prescription_expiring',
  PRESCRIPTION_EXPIRED = 'prescription_expired',
  PRESCRIPTION_REFILL_DUE = 'prescription_refill_due',
  PRESCRIPTION_DISPENSED = 'prescription_dispensed',
  PRESCRIPTION_CANCELLED = 'prescription_cancelled',

  LAB_RESULT_AVAILABLE = 'lab_result_available',
  LAB_RESULT_CRITICAL = 'lab_result_critical',

  HEALTH_DOCUMENT_SHARED = 'health_document_shared',
  HEALTH_DOCUMENT_UPLOADED = 'health_document_uploaded',

  CONSENT_REQUEST = 'consent_request',
  CONSENT_APPROVED = 'consent_approved',
  CONSENT_REVOKED = 'consent_revoked',
  CONSENT_EXPIRING = 'consent_expiring',

  ENCOUNTER_CREATED = 'encounter_created',
  ENCOUNTER_UPDATED = 'encounter_updated',

  SYSTEM_ALERT = 'system_alert',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SECURITY_ALERT = 'security_alert',

  ACCOUNT_VERIFICATION = 'account_verification',
  PASSWORD_CHANGED = 'password_changed',
  LOGIN_DETECTED = 'login_detected',

  GENERIC = 'generic',
}

/**
 * Notification Priority - determines urgency
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Notification Status - lifecycle states
 */
export enum NotificationStatus {
  PENDING = 'pending', // Created but not yet sent
  SENT = 'sent', // Successfully sent to delivery service
  DELIVERED = 'delivered', // Confirmed delivery (if supported)
  READ = 'read', // User has read the notification
  FAILED = 'failed', // Failed to send
  EXPIRED = 'expired', // Expired before being read
}

/**
 * Notification Channel - delivery methods
 */
export enum NotificationChannel {
  IN_APP = 'in_app', // In-app notification
  EMAIL = 'email', // Email notification
  SMS = 'sms', // SMS text message
  PUSH = 'push', // Push notification (FCM/APNS)
  WEBHOOK = 'webhook', // Webhook callback
}

/**
 * Action Button Schema - for interactive notifications
 */
@Schema({ _id: false })
export class ActionButton {
  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  action!: string; // e.g., 'view_prescription', 'confirm_appointment'

  @Prop({ type: MongooseSchema.Types.Mixed })
  data?: Record<string, any>;

  @Prop({ default: 'primary' })
  style?: string; // 'primary', 'secondary', 'danger'
}

export const ActionButtonSchema = SchemaFactory.createForClass(ActionButton);

/**
 * Delivery Result Schema - tracks delivery status per channel
 */
@Schema({ _id: false })
export class DeliveryResult {
  @Prop({
    required: true,
    enum: Object.values(NotificationChannel),
  })
  channel!: NotificationChannel;

  @Prop({ required: true })
  status!: string; // 'success', 'failed', 'pending'

  @Prop()
  sentAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  failureReason?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>; // Provider-specific data (message ID, etc.)
}

export const DeliveryResultSchema = SchemaFactory.createForClass(DeliveryResult);

/**
 * Notification Schema - Comprehensive notification system with multi-channel support
 */
@Schema({
  timestamps: true,
  collection: 'notifications',
})
export class Notification {
  @Prop({
    required: true,
    enum: Object.values(NotificationType),
    index: true,
  })
  type!: NotificationType;

  @Prop({
    required: true,
    enum: Object.values(NotificationPriority),
    default: NotificationPriority.NORMAL,
    index: true,
  })
  priority!: NotificationPriority;

  @Prop({
    required: true,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.PENDING,
    index: true,
  })
  status!: NotificationStatus;

  // Recipient Information
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  recipientId!: MongooseSchema.Types.ObjectId;

  @Prop()
  recipientEmail?: string;

  @Prop()
  recipientPhone?: string;

  @Prop()
  recipientDeviceTokens?: string[]; // FCM/APNS tokens for push notifications

  // Content
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop()
  shortMessage?: string; // For SMS or short previews

  // Related Entity References
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    refPath: 'relatedEntityModel',
  })
  relatedEntityId?: MongooseSchema.Types.ObjectId;

  @Prop({
    enum: [
      'Patient',
      'Doctor',
      'Hospital',
      'Appointment',
      'Prescription',
      'Encounter',
      'HealthDocument',
      'Consent',
    ],
  })
  relatedEntityModel?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  relatedEntityData?: Record<string, any>; // Snapshot of related data

  // Delivery Channels
  @Prop({
    type: [String],
    required: true,
    default: [NotificationChannel.IN_APP],
    enum: Object.values(NotificationChannel),
  })
  channels!: NotificationChannel[];

  @Prop({ type: [DeliveryResultSchema] })
  deliveryResults?: DeliveryResult[];

  // Action Buttons for interactive notifications
  @Prop({ type: [ActionButtonSchema] })
  actions?: ActionButton[];

  // Deep link for mobile apps
  @Prop()
  deepLink?: string;

  // Web link
  @Prop()
  webLink?: string;

  // Timing
  @Prop()
  scheduledFor?: Date; // For scheduled notifications

  @Prop()
  sentAt?: Date;

  @Prop({ index: true })
  readAt?: Date;

  @Prop()
  expiresAt?: Date; // Auto-expire after certain time

  // Grouping and categorization
  @Prop({ index: true })
  category?: string; // For grouping notifications

  @Prop()
  groupKey?: string; // For collapsing similar notifications

  // Metadata
  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  @Prop()
  imageUrl?: string; // Optional image for rich notifications

  @Prop()
  iconUrl?: string; // Optional icon

  // Tracking
  @Prop({ default: 0 })
  retryCount?: number;

  @Prop()
  lastRetryAt?: Date;

  @Prop()
  failureReason?: string;

  // Preferences
  @Prop({ default: true })
  canDismiss?: boolean;

  @Prop({ default: false })
  requiresAcknowledgment?: boolean;

  @Prop()
  acknowledgedAt?: Date;

  // Sender Information (optional, for user-to-user notifications)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  senderId?: MongooseSchema.Types.ObjectId;

  @Prop()
  senderName?: string;

  // Soft delete support
  @Prop({ default: false })
  isDeleted?: boolean;

  @Prop()
  deletedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Note: Soft delete fields (isDeleted, deletedAt) already defined in schema, no plugin needed

// Compound Indexes
NotificationSchema.index({ recipientId: 1, status: 1 });
NotificationSchema.index({ recipientId: 1, readAt: 1 });
NotificationSchema.index({ recipientId: 1, type: 1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, priority: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, scheduledFor: 1 }); // For scheduled notifications
NotificationSchema.index({ expiresAt: 1 }); // For cleanup
NotificationSchema.index({ groupKey: 1, recipientId: 1 }); // For grouping

// Virtual for checking if expired
NotificationSchema.virtual('isExpired').get(function (this: NotificationDocument) {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for checking if read
NotificationSchema.virtual('isRead').get(function (this: NotificationDocument) {
  return !!this.readAt;
});

// Ensure virtuals are serialized
NotificationSchema.set('toJSON', { virtuals: true });
NotificationSchema.set('toObject', { virtuals: true });
