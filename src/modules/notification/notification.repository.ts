import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationStatus,
  NotificationType,
} from './schemas/notification.schema';
import { BaseRepository } from '../../common/base.repository';
import { NotificationFilterDto } from './dto/notification-filter.dto';

@Injectable()
export class NotificationRepository extends BaseRepository<NotificationDocument> {
  protected readonly logger = new Logger(NotificationRepository.name);

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(notificationModel, connection);
  }

  /**
   * Find notifications with filters and pagination
   */
  async findWithFilters(filters: NotificationFilterDto): Promise<{ data: any[]; total: number }> {
    const query: any = { isDeleted: { $ne: true } };

    // Apply filters
    if (filters.recipientId) {
      query.recipientId = new Types.ObjectId(filters.recipientId);
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    if (filters.channel) {
      query.channels = filters.channel;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.isRead !== undefined) {
      query.readAt = filters.isRead ? { $ne: null } : null;
    }

    if (filters.isExpired !== undefined && filters.isExpired) {
      query.expiresAt = { $lt: new Date() };
    }

    if (filters.createdAfter) {
      query.createdAt = { ...query.createdAt, $gte: filters.createdAfter };
    }

    if (filters.createdBefore) {
      query.createdAt = { ...query.createdAt, $lte: filters.createdBefore };
    }

    if (filters.relatedEntityId) {
      query.relatedEntityId = new Types.ObjectId(filters.relatedEntityId);
    }

    if (filters.relatedEntityModel) {
      query.relatedEntityModel = filters.relatedEntityModel;
    }

    if (filters.senderId) {
      query.senderId = new Types.ObjectId(filters.senderId);
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Sort
    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };

    // Execute query
    const [data, total] = await Promise.all([
      this.notificationModel.find(query).sort(sort).skip(skip).limit(limit).lean().exec(),
      this.notificationModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  /**
   * Find unread notifications for a user
   */
  async findUnreadByUser(userId: string, limit: number = 50): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({
        recipientId: new Types.ObjectId(userId),
        readAt: null,
        status: { $in: [NotificationStatus.SENT, NotificationStatus.DELIVERED] },
        isDeleted: { $ne: true },
      })
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Find notifications by recipient and status
   */
  async findByRecipientAndStatus(
    recipientId: string,
    status: NotificationStatus,
    limit: number = 50,
  ): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({
        recipientId: new Types.ObjectId(recipientId),
        status,
        isDeleted: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Find notifications by related entity
   */
  async findByRelatedEntity(
    entityId: string,
    entityModel: string,
  ): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({
        relatedEntityId: new Types.ObjectId(entityId),
        relatedEntityModel: entityModel,
        isDeleted: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findByIdAndUpdate(
        notificationId,
        {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Mark multiple notifications as read
   */
  async markManyAsRead(notificationIds: string[]): Promise<number> {
    const result = await this.notificationModel
      .updateMany(
        {
          _id: { $in: notificationIds.map((id) => new Types.ObjectId(id)) },
          readAt: null,
        },
        {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      )
      .exec();

    return result.modifiedCount;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsReadForUser(userId: string): Promise<number> {
    const result = await this.notificationModel
      .updateMany(
        {
          recipientId: new Types.ObjectId(userId),
          readAt: null,
          isDeleted: { $ne: true },
        },
        {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      )
      .exec();

    return result.modifiedCount;
  }

  /**
   * Mark notification as acknowledged
   */
  async markAsAcknowledged(notificationId: string): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findByIdAndUpdate(
        notificationId,
        {
          acknowledgedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Update delivery result
   */
  async updateDeliveryResult(
    notificationId: string,
    deliveryResult: any,
  ): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findByIdAndUpdate(
        notificationId,
        {
          $push: { deliveryResults: deliveryResult },
          $inc: { retryCount: deliveryResult.status === 'failed' ? 1 : 0 },
          lastRetryAt: deliveryResult.status === 'failed' ? new Date() : undefined,
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Find expired notifications
   */
  async findExpired(): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({
        expiresAt: { $lt: new Date() },
        status: { $ne: NotificationStatus.EXPIRED },
        isDeleted: { $ne: true },
      })
      .exec();
  }

  /**
   * Mark expired notifications
   */
  async markExpired(): Promise<number> {
    const result = await this.notificationModel
      .updateMany(
        {
          expiresAt: { $lt: new Date() },
          status: { $ne: NotificationStatus.EXPIRED },
          isDeleted: { $ne: true },
        },
        {
          status: NotificationStatus.EXPIRED,
        },
      )
      .exec();

    return result.modifiedCount;
  }

  /**
   * Find scheduled notifications ready to send
   */
  async findScheduledReady(): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({
        status: NotificationStatus.PENDING,
        scheduledFor: { $lte: new Date() },
        isDeleted: { $ne: true },
      })
      .sort({ priority: -1, scheduledFor: 1 })
      .limit(100)
      .exec();
  }

  /**
   * Get notification count by status for user
   */
  async getCountsByStatus(userId: string): Promise<Record<string, number>> {
    const result = await this.notificationModel
      .aggregate([
        {
          $match: {
            recipientId: new Types.ObjectId(userId),
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const counts: Record<string, number> = {};
    result.forEach((item: any) => {
      counts[item._id] = item.count;
    });

    return counts;
  }

  /**
   * Get notification statistics for user
   */
  async getUserStatistics(userId: string): Promise<any> {
    const result = await this.notificationModel
      .aggregate([
        {
          $match: {
            recipientId: new Types.ObjectId(userId),
            isDeleted: { $ne: true },
          },
        },
        {
          $facet: {
            total: [{ $count: 'count' }],
            unread: [{ $match: { readAt: null } }, { $count: 'count' }],
            read: [{ $match: { readAt: { $ne: null } } }, { $count: 'count' }],
            pending: [{ $match: { status: NotificationStatus.PENDING } }, { $count: 'count' }],
            failed: [{ $match: { status: NotificationStatus.FAILED } }, { $count: 'count' }],
            byType: [
              {
                $group: {
                  _id: '$type',
                  count: { $sum: 1 },
                },
              },
            ],
            byPriority: [
              {
                $group: {
                  _id: '$priority',
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ])
      .exec();

    const stats = result[0];

    const formatCount = (arr: any[]) => (arr.length > 0 ? arr[0].count : 0);
    const formatGroup = (arr: any[]) => {
      const obj: Record<string, number> = {};
      arr.forEach((item: any) => {
        obj[item._id] = item.count;
      });
      return obj;
    };

    return {
      total: formatCount(stats.total),
      unread: formatCount(stats.unread),
      read: formatCount(stats.read),
      pending: formatCount(stats.pending),
      failed: formatCount(stats.failed),
      byType: formatGroup(stats.byType),
      byPriority: formatGroup(stats.byPriority),
    };
  }

  /**
   * Delete old read notifications (cleanup)
   */
  async deleteOldReadNotifications(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationModel
      .deleteMany({
        readAt: { $ne: null, $lt: cutoffDate },
        status: NotificationStatus.READ,
      })
      .exec();

    return result.deletedCount;
  }

  /**
   * Find notifications by group key
   */
  async findByGroupKey(groupKey: string, recipientId?: string): Promise<NotificationDocument[]> {
    const query: any = {
      groupKey,
      isDeleted: { $ne: true },
    };

    if (recipientId) {
      query.recipientId = new Types.ObjectId(recipientId);
    }

    return this.notificationModel.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Count unread notifications by type
   */
  async countUnreadByType(userId: string, type: NotificationType): Promise<number> {
    return this.notificationModel
      .countDocuments({
        recipientId: new Types.ObjectId(userId),
        type,
        readAt: null,
        isDeleted: { $ne: true },
      })
      .exec();
  }
}
