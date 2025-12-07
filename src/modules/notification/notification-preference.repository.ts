import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import {
  NotificationPreference,
  NotificationPreferenceDocument,
} from './schemas/notification-preference.schema';
import { BaseRepository } from '../../common/base.repository';

@Injectable()
export class NotificationPreferenceRepository extends BaseRepository<NotificationPreferenceDocument> {
  protected readonly logger = new Logger(NotificationPreferenceRepository.name);

  constructor(
    @InjectModel(NotificationPreference.name)
    private preferenceModel: Model<NotificationPreferenceDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(preferenceModel, connection);
  }

  /**
   * Find preference by user ID
   */
  async findByUserId(userId: string): Promise<NotificationPreferenceDocument | null> {
    return this.preferenceModel
      .findOne({
        userId: new Types.ObjectId(userId),
        isDeleted: { $ne: true },
      })
      .exec();
  }

  /**
   * Create or update preference for user
   */
  async upsertByUserId(
    userId: string,
    data: Partial<NotificationPreference>,
  ): Promise<NotificationPreferenceDocument> {
    return this.preferenceModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: data },
        { new: true, upsert: true },
      )
      .exec();
  }

  /**
   * Add device token to user preferences
   */
  async addDeviceToken(
    userId: string,
    token: string,
  ): Promise<NotificationPreferenceDocument | null> {
    return this.preferenceModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $addToSet: { deviceTokens: token } },
        { new: true, upsert: true },
      )
      .exec();
  }

  /**
   * Remove device token from user preferences
   */
  async removeDeviceToken(
    userId: string,
    token: string,
  ): Promise<NotificationPreferenceDocument | null> {
    return this.preferenceModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $pull: { deviceTokens: token } },
        { new: true },
      )
      .exec();
  }

  /**
   * Find users with specific device tokens (for broadcast)
   */
  async findByDeviceToken(token: string): Promise<NotificationPreferenceDocument | null> {
    return this.preferenceModel
      .findOne({
        deviceTokens: token,
        isDeleted: { $ne: true },
      })
      .exec();
  }

  /**
   * Find all users with push notification enabled
   */
  async findPushEnabled(): Promise<NotificationPreferenceDocument[]> {
    return this.preferenceModel
      .find({
        enabled: true,
        preferredChannels: 'push',
        deviceTokens: { $exists: true, $ne: [] },
        isDeleted: { $ne: true },
      })
      .exec();
  }
}
