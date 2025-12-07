import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
} from '../schemas/notification.schema';

/**
 * Output DTO for action button
 */
export class ActionButtonOutputDto {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  action!: string;

  @ApiProperty({ required: false })
  data?: Record<string, any>;

  @ApiProperty({ required: false })
  style?: string;
}

/**
 * Output DTO for delivery result
 */
export class DeliveryResultOutputDto {
  @ApiProperty({ enum: NotificationChannel })
  channel!: NotificationChannel;

  @ApiProperty()
  status!: string;

  @ApiProperty({ required: false })
  sentAt?: Date;

  @ApiProperty({ required: false })
  deliveredAt?: Date;

  @ApiProperty({ required: false })
  failureReason?: string;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;
}

/**
 * Output DTO for single notification
 */
export class NotificationOutputDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ enum: NotificationPriority })
  priority!: NotificationPriority;

  @ApiProperty({ enum: NotificationStatus })
  status!: NotificationStatus;

  @ApiProperty()
  recipientId!: string;

  @ApiProperty({ required: false })
  recipientEmail?: string;

  @ApiProperty({ required: false })
  recipientPhone?: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty({ required: false })
  shortMessage?: string;

  @ApiProperty({ required: false })
  relatedEntityId?: string;

  @ApiProperty({ required: false })
  relatedEntityModel?: string;

  @ApiProperty({ required: false })
  relatedEntityData?: Record<string, any>;

  @ApiProperty({ type: [String], enum: NotificationChannel })
  channels!: NotificationChannel[];

  @ApiProperty({ type: [DeliveryResultOutputDto], required: false })
  deliveryResults?: DeliveryResultOutputDto[];

  @ApiProperty({ type: [ActionButtonOutputDto], required: false })
  actions?: ActionButtonOutputDto[];

  @ApiProperty({ required: false })
  deepLink?: string;

  @ApiProperty({ required: false })
  webLink?: string;

  @ApiProperty({ required: false })
  scheduledFor?: Date;

  @ApiProperty({ required: false })
  sentAt?: Date;

  @ApiProperty({ required: false })
  readAt?: Date;

  @ApiProperty({ required: false })
  expiresAt?: Date;

  @ApiProperty({ required: false })
  category?: string;

  @ApiProperty({ required: false })
  groupKey?: string;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ required: false })
  imageUrl?: string;

  @ApiProperty({ required: false })
  iconUrl?: string;

  @ApiProperty({ required: false })
  retryCount?: number;

  @ApiProperty({ required: false })
  failureReason?: string;

  @ApiProperty({ required: false })
  canDismiss?: boolean;

  @ApiProperty({ required: false })
  requiresAcknowledgment?: boolean;

  @ApiProperty({ required: false })
  acknowledgedAt?: Date;

  @ApiProperty({ required: false })
  senderId?: string;

  @ApiProperty({ required: false })
  senderName?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ description: 'Virtual field - is notification expired' })
  isExpired?: boolean;

  @ApiProperty({ description: 'Virtual field - is notification read' })
  isRead?: boolean;
}

/**
 * Output DTO for notification list with pagination
 */
export class NotificationListOutputDto {
  @ApiProperty({ type: [NotificationOutputDto] })
  data!: NotificationOutputDto[];

  @ApiProperty({ example: 50, description: 'Total count' })
  total!: number;

  @ApiProperty({ example: 1, description: 'Current page' })
  page!: number;

  @ApiProperty({ example: 20, description: 'Items per page' })
  limit!: number;

  @ApiProperty({ example: 3, description: 'Total pages' })
  totalPages!: number;

  @ApiProperty({ example: true, description: 'Has next page' })
  hasNext!: boolean;

  @ApiProperty({ example: false, description: 'Has previous page' })
  hasPrev!: boolean;
}

/**
 * Output DTO for notification statistics
 */
export class NotificationStatsOutputDto {
  @ApiProperty({ example: 50, description: 'Total notifications' })
  total!: number;

  @ApiProperty({ example: 15, description: 'Unread count' })
  unread!: number;

  @ApiProperty({ example: 35, description: 'Read count' })
  read!: number;

  @ApiProperty({ example: 5, description: 'Pending delivery' })
  pending!: number;

  @ApiProperty({ example: 2, description: 'Failed delivery' })
  failed!: number;

  @ApiProperty({
    example: {
      prescription_expiring: 10,
      appointment_reminder: 5,
    },
    description: 'Count by type',
  })
  byType!: Record<string, number>;

  @ApiProperty({
    example: {
      high: 8,
      normal: 40,
      low: 2,
    },
    description: 'Count by priority',
  })
  byPriority!: Record<string, number>;
}
