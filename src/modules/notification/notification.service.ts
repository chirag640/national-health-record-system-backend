import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
  NotificationType,
} from './schemas/notification.schema';
import { NotificationPreferenceDocument } from './schemas/notification-preference.schema';
import { NotificationRepository } from './notification.repository';
import { NotificationPreferenceRepository } from './notification-preference.repository';
import { CreateNotificationDto, CreateBulkNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationFilterDto } from './dto/notification-filter.dto';
import { NotificationPreferenceDto } from './dto/notification-preference.dto';
import { NotificationProducer } from '../queue/producers/notification.producer';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private readonly notificationRepository: NotificationRepository,
    private readonly preferenceRepository: NotificationPreferenceRepository,
    @Optional() private readonly notificationProducer?: NotificationProducer,
  ) {}

  /**
   * Create a new notification
   */
  async create(createDto: CreateNotificationDto): Promise<NotificationDocument> {
    this.logger.log(`Creating notification for user ${createDto.recipientId}`);

    // Get user preferences
    const preferences = await this.preferenceRepository.findByUserId(createDto.recipientId);

    // Check if notifications are enabled for user
    if (preferences && !preferences.enabled) {
      this.logger.warn(`Notifications disabled for user ${createDto.recipientId}`);
      // Create notification but don't send
      const notification = new this.notificationModel({
        ...createDto,
        recipientId: new Types.ObjectId(createDto.recipientId),
        relatedEntityId: createDto.relatedEntityId
          ? new Types.ObjectId(createDto.relatedEntityId)
          : undefined,
        senderId: createDto.senderId ? new Types.ObjectId(createDto.senderId) : undefined,
        status: NotificationStatus.PENDING,
      });

      return notification.save();
    }

    // Apply user preferences to channels
    let channels = createDto.channels;
    if (preferences) {
      channels = this.applyPreferences(createDto.channels, createDto.type, preferences);
    }

    // Check quiet hours
    if (preferences && this.isQuietHours(preferences, createDto.type)) {
      this.logger.log(
        `Quiet hours active for user ${createDto.recipientId}, scheduling notification`,
      );
      const scheduledFor = this.calculateNextActiveTime(preferences);
      createDto.scheduledFor = scheduledFor;
    }

    // Create notification document
    const notification = new this.notificationModel({
      ...createDto,
      recipientId: new Types.ObjectId(createDto.recipientId),
      relatedEntityId: createDto.relatedEntityId
        ? new Types.ObjectId(createDto.relatedEntityId)
        : undefined,
      senderId: createDto.senderId ? new Types.ObjectId(createDto.senderId) : undefined,
      channels,
      status: createDto.scheduledFor ? NotificationStatus.PENDING : NotificationStatus.SENT,
    });

    const savedNotification = await notification.save();

    // Queue for delivery if not scheduled
    if (!createDto.scheduledFor) {
      await this.queueForDelivery(savedNotification);
    }

    return savedNotification;
  }

  /**
   * Create bulk notifications
   */
  async createBulk(
    createBulkDto: CreateBulkNotificationDto,
  ): Promise<{ created: number; failed: number }> {
    this.logger.log(`Creating bulk notifications for ${createBulkDto.recipientIds.length} users`);

    let created = 0;
    let failed = 0;

    for (const recipientId of createBulkDto.recipientIds) {
      try {
        await this.create({
          type: createBulkDto.type,
          priority: createBulkDto.priority,
          recipientId,
          title: createBulkDto.title,
          message: createBulkDto.message,
          channels: createBulkDto.channels,
          category: createBulkDto.category,
          scheduledFor: createBulkDto.scheduledFor,
        } as CreateNotificationDto);
        created++;
      } catch (error) {
        this.logger.error(`Failed to create notification for user ${recipientId}:`, error);
        failed++;
      }
    }

    return { created, failed };
  }

  /**
   * Find all notifications with filters
   */
  async findAll(filters: NotificationFilterDto): Promise<any> {
    const { data, total } = await this.notificationRepository.findWithFilters(filters);

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Find one notification by ID
   */
  async findOne(id: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findById(id).exec();

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  /**
   * Get unread notifications for user
   */
  async getUnreadForUser(userId: string, limit: number = 50): Promise<NotificationDocument[]> {
    return this.notificationRepository.findUnreadByUser(userId, limit);
  }

  /**
   * Get notifications by status for user
   */
  async getByStatusForUser(
    userId: string,
    status: NotificationStatus,
    limit: number = 50,
  ): Promise<NotificationDocument[]> {
    return this.notificationRepository.findByRecipientAndStatus(userId, status, limit);
  }

  /**
   * Update notification
   */
  async update(id: string, updateDto: UpdateNotificationDto): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findById(id).exec();

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    Object.assign(notification, updateDto);
    return notification.save();
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<NotificationDocument> {
    const notification = await this.notificationRepository.markAsRead(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    this.logger.log(`Notification ${id} marked as read`);
    return notification;
  }

  /**
   * Mark multiple notifications as read
   */
  async markManyAsRead(ids: string[]): Promise<{ modifiedCount: number }> {
    const modifiedCount = await this.notificationRepository.markManyAsRead(ids);
    this.logger.log(`${modifiedCount} notifications marked as read`);
    return { modifiedCount };
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsReadForUser(userId: string): Promise<{ modifiedCount: number }> {
    const modifiedCount = await this.notificationRepository.markAllAsReadForUser(userId);
    this.logger.log(`${modifiedCount} notifications marked as read for user ${userId}`);
    return { modifiedCount };
  }

  /**
   * Mark notification as acknowledged
   */
  async markAsAcknowledged(id: string): Promise<NotificationDocument> {
    const notification = await this.notificationRepository.markAsAcknowledged(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    this.logger.log(`Notification ${id} acknowledged`);
    return notification;
  }

  /**
   * Delete notification (soft delete)
   */
  async remove(id: string): Promise<void> {
    await this.notificationModel
      .findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() })
      .exec();
    this.logger.log(`Notification ${id} deleted`);
  }

  /**
   * Delete multiple notifications
   */
  async removeMany(ids: string[]): Promise<{ deletedCount: number }> {
    let deletedCount = 0;

    for (const id of ids) {
      try {
        await this.notificationModel
          .findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() })
          .exec();
        deletedCount++;
      } catch (error) {
        this.logger.error(`Failed to delete notification ${id}:`, error);
      }
    }

    return { deletedCount };
  }

  /**
   * Get notification statistics for user
   */
  async getUserStatistics(userId: string): Promise<any> {
    return this.notificationRepository.getUserStatistics(userId);
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications(): Promise<number> {
    const notifications = await this.notificationRepository.findScheduledReady();

    this.logger.log(`Found ${notifications.length} scheduled notifications ready to send`);

    for (const notification of notifications) {
      try {
        await this.queueForDelivery(notification);
        notification.status = NotificationStatus.SENT;
        await notification.save();
      } catch (error) {
        this.logger.error(`Failed to process scheduled notification ${notification._id}:`, error);
      }
    }

    return notifications.length;
  }

  /**
   * Process expired notifications
   */
  async processExpiredNotifications(): Promise<number> {
    const count = await this.notificationRepository.markExpired();
    this.logger.log(`Marked ${count} notifications as expired`);
    return count;
  }

  /**
   * Cleanup old notifications
   */
  async cleanupOldNotifications(daysOld: number = 90): Promise<number> {
    const count = await this.notificationRepository.deleteOldReadNotifications(daysOld);
    this.logger.log(`Deleted ${count} old read notifications`);
    return count;
  }

  // ========== Preference Management ==========

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferenceDocument> {
    let preferences = await this.preferenceRepository.findByUserId(userId);

    if (!preferences) {
      // Create default preferences
      preferences = await this.preferenceRepository.upsertByUserId(userId, {
        userId: new Types.ObjectId(userId),
        enabled: true,
        preferredChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      } as any);
    }

    return preferences;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferencesDto: NotificationPreferenceDto,
  ): Promise<NotificationPreferenceDocument> {
    return this.preferenceRepository.upsertByUserId(userId, preferencesDto);
  }

  /**
   * Add device token
   */
  async addDeviceToken(userId: string, token: string): Promise<NotificationPreferenceDocument> {
    const preferences = await this.preferenceRepository.addDeviceToken(userId, token);

    if (!preferences) {
      throw new NotFoundException(`Preferences for user ${userId} not found`);
    }

    return preferences;
  }

  /**
   * Remove device token
   */
  async removeDeviceToken(userId: string, token: string): Promise<NotificationPreferenceDocument> {
    const preferences = await this.preferenceRepository.removeDeviceToken(userId, token);

    if (!preferences) {
      throw new NotFoundException(`Preferences for user ${userId} not found`);
    }

    return preferences;
  }

  // ========== Helper Methods ==========

  /**
   * Queue notification for delivery via appropriate channels
   */
  private async queueForDelivery(notification: NotificationDocument): Promise<void> {
    if (!this.notificationProducer) {
      this.logger.warn('NotificationProducer not available (Redis not configured)');
      return;
    }

    for (const channel of notification.channels) {
      try {
        switch (channel) {
          case NotificationChannel.EMAIL:
            await this.notificationProducer.sendEmail({
              to: notification.recipientEmail || '',
              subject: notification.title,
              template: 'notification' as any,
              context: {
                subject: notification.title,
                message: notification.message,
              },
            });
            break;

          case NotificationChannel.SMS:
            if (notification.recipientPhone) {
              await this.notificationProducer.sendSMS({
                phoneNumber: notification.recipientPhone,
                message: notification.shortMessage || notification.message,
              });
            }
            break;

          case NotificationChannel.PUSH:
            if (
              notification.recipientDeviceTokens &&
              notification.recipientDeviceTokens.length > 0
            ) {
              await this.notificationProducer.sendPushNotification({
                userId: notification.recipientId.toString(),
                title: notification.title,
                message: notification.message,
                data: {
                  notificationId: notification._id.toString(),
                  type: notification.type,
                  ...notification.metadata,
                },
                priority:
                  notification.priority === NotificationPriority.CRITICAL ? 'high' : 'normal',
              });
            }
            break;

          case NotificationChannel.IN_APP:
            // In-app notifications are already stored in DB, no action needed
            break;

          default:
            this.logger.warn(`Unsupported channel: ${channel}`);
        }

        // Record successful delivery initiation
        await this.notificationRepository.updateDeliveryResult(notification._id.toString(), {
          channel,
          status: 'success',
          sentAt: new Date(),
        });
      } catch (error) {
        this.logger.error(`Failed to deliver notification via ${channel}:`, error);

        // Record delivery failure
        await this.notificationRepository.updateDeliveryResult(notification._id.toString(), {
          channel,
          status: 'failed',
          failureReason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Apply user preferences to notification channels
   */
  private applyPreferences(
    channels: NotificationChannel[],
    type: NotificationType,
    preferences: NotificationPreferenceDocument,
  ): NotificationChannel[] {
    // Check type-specific preferences
    const typePreference = preferences.typePreferences.find((tp) => tp.type === type);

    if (typePreference && !typePreference.enabled) {
      return [NotificationChannel.IN_APP]; // Always keep in-app
    }

    if (typePreference && typePreference.channels && typePreference.channels.length > 0) {
      // Use type-specific channel preferences
      const enabledChannels = typePreference.channels
        .filter((cp) => cp.enabled)
        .map((cp) => cp.channel);

      return channels.filter((c) => enabledChannels.includes(c));
    }

    // Use global preferences
    return channels.filter((c) => preferences.preferredChannels.includes(c));
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(
    preferences: NotificationPreferenceDocument,
    type: NotificationType,
  ): boolean {
    if (!preferences.quietHours.enabled) {
      return false;
    }

    // Check if this type is excluded from quiet hours
    if (preferences.quietHours.excludeTypes && preferences.quietHours.excludeTypes.includes(type)) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const start = preferences.quietHours.startTime || '22:00';
    const end = preferences.quietHours.endTime || '08:00';

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }

  /**
   * Calculate next active time after quiet hours
   */
  private calculateNextActiveTime(preferences: NotificationPreferenceDocument): Date {
    const now = new Date();
    const endTime = preferences.quietHours.endTime || '08:00';
    const [hours, minutes] = endTime.split(':').map(Number);

    const nextActiveTime = new Date(now);
    nextActiveTime.setHours(hours || 8, minutes || 0, 0, 0);

    // If end time is earlier today, it means it's tomorrow
    if (nextActiveTime < now) {
      nextActiveTime.setDate(nextActiveTime.getDate() + 1);
    }

    return nextActiveTime;
  }

  /**
   * Create notification helper for other modules
   */
  async createHelper(params: {
    type: NotificationType;
    priority: NotificationPriority;
    recipientId: string;
    title: string;
    message: string;
    channels?: NotificationChannel[];
    relatedEntityId?: string;
    relatedEntityModel?: string;
    relatedEntityData?: Record<string, any>;
    category?: string;
    deepLink?: string;
    webLink?: string;
    actions?: any[];
  }): Promise<NotificationDocument> {
    return this.create({
      ...params,
      channels: params.channels || [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    } as CreateNotificationDto);
  }
}
