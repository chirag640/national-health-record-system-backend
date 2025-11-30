import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../queue.module';
import { QueueConfigService } from '../queue.config';
import {
  FollowUpReminderJob,
  PushNotificationJob,
  EmailNotificationJob,
  SMSNotificationJob,
  BulkNotificationJob,
} from '../interfaces/notification-jobs.interface';

@Injectable()
export class NotificationProducer {
  private readonly logger = new Logger(NotificationProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
    private readonly queueConfig: QueueConfigService,
  ) {}

  /**
   * Schedule a follow-up reminder for a patient appointment
   */
  async scheduleFollowUpReminder(data: FollowUpReminderJob) {
    const delay = this.queueConfig.calculateDelay(data.reminderDate);
    
    const job = await this.notificationQueue.add(
      'follow-up-reminder',
      data,
      this.queueConfig.buildJobOptions(
        this.queueConfig.PRIORITY.HIGH,
        'critical',
        delay,
        { jobId: `reminder-${data.appointmentId}` },
      ),
    );

    this.logger.log(`Scheduled follow-up reminder job ${job.id} for appointment ${data.appointmentId}`);
    return job;
  }

  /**
   * Send push notification to user
   */
  async sendPushNotification(data: PushNotificationJob) {
    const priority = data.priority === 'high' 
      ? this.queueConfig.PRIORITY.CRITICAL 
      : this.queueConfig.PRIORITY.NORMAL;

    const job = await this.notificationQueue.add(
      'push-notification',
      data,
      this.queueConfig.buildJobOptions(priority, 'critical'),
    );

    this.logger.log(`Queued push notification job ${job.id} for user ${data.userId}`);
    return job;
  }

  /**
   * Send email notification
   */
  async sendEmail(data: EmailNotificationJob) {
    const job = await this.notificationQueue.add(
      'email-notification',
      data,
      this.queueConfig.buildJobOptions(
        this.queueConfig.PRIORITY.NORMAL,
        'standard',
      ),
    );

    this.logger.log(`Queued email job ${job.id} to ${data.to}`);
    return job;
  }

  /**
   * Send SMS notification
   */
  async sendSMS(data: SMSNotificationJob) {
    const job = await this.notificationQueue.add(
      'sms-notification',
      data,
      this.queueConfig.buildJobOptions(
        this.queueConfig.PRIORITY.HIGH,
        'critical',
      ),
    );

    this.logger.log(`Queued SMS job ${job.id} to ${data.phoneNumber}`);
    return job;
  }

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulkNotification(data: BulkNotificationJob) {
    const priority = data.priority === 'high'
      ? this.queueConfig.PRIORITY.HIGH
      : this.queueConfig.PRIORITY.LOW;

    const job = await this.notificationQueue.add(
      'bulk-notification',
      data,
      this.queueConfig.buildJobOptions(priority, 'background'),
    );

    this.logger.log(`Queued bulk notification job ${job.id} for ${data.userIds.length} users`);
    return job;
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduledNotification(jobId: string) {
    const job = await this.notificationQueue.getJob(jobId);
    
    if (job) {
      await job.remove();
      this.logger.log(`Cancelled notification job ${jobId}`);
      return true;
    }
    
    return false;
  }

  /**
   * Get notification job status
   */
  async getJobStatus(jobId: string) {
    const job = await this.notificationQueue.getJob(jobId);
    
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      state: await job.getState(),
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      finishedOn: job.finishedOn,
    };
  }
}
