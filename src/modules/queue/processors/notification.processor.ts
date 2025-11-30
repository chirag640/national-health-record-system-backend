import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../queue.module';
import {
  FollowUpReminderJob,
  PushNotificationJob,
  EmailNotificationJob,
  SMSNotificationJob,
  BulkNotificationJob,
} from '../interfaces/notification-jobs.interface';
import { EmailService } from '../../../email/email.service';

@Processor(QUEUE_NAMES.NOTIFICATION, {
  concurrency: parseInt(process.env.QUEUE_NOTIFICATION_CONCURRENCY || '5'),
  limiter: {
    max: 100,
    duration: 60000, // 100 jobs per minute
  },
})
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    /* private readonly _configService: ConfigService, */
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing ${job.name} job ${job.id}`);

    try {
      switch (job.name) {
        case 'follow-up-reminder':
          return await this.handleFollowUpReminder(job.data as FollowUpReminderJob, job);

        case 'push-notification':
          return await this.handlePushNotification(job.data as PushNotificationJob, job);

        case 'email-notification':
          return await this.handleEmailNotification(job.data as EmailNotificationJob, job);

        case 'sms-notification':
          return await this.handleSMSNotification(job.data as SMSNotificationJob, job);

        case 'bulk-notification':
          return await this.handleBulkNotification(job.data as BulkNotificationJob, job);

        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Error processing ${job.name} job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle follow-up reminder notification
   */
  private async handleFollowUpReminder(data: FollowUpReminderJob, job: Job) {
    this.logger.log(`Sending follow-up reminder for appointment ${data.appointmentId}`);

    await job.updateProgress(20);

    // TODO: Implement actual reminder sending logic
    // Example: Send SMS/Email/Push notification to worker
    // Message: Hello {workerName}, this is a reminder for your {appointmentType} appointment.

    if (data.workerPhone) {
      // Send SMS (integrate with SMS service)
      this.logger.log(`Sending SMS to ${data.workerPhone}`);
    }

    await job.updateProgress(100);

    return {
      success: true,
      appointmentId: data.appointmentId,
      sentAt: new Date(),
    };
  }

  /**
   * Handle push notification
   */
  private async handlePushNotification(data: PushNotificationJob, job: Job) {
    this.logger.log(`Sending push notification to user ${data.userId}`);

    await job.updateProgress(30);

    // TODO: Integrate with push notification service (FCM, APNs, etc.)
    // Example implementation:
    // await this.fcmService.send(data.userId, data.title, data.message, data.data);

    await job.updateProgress(100);

    return {
      success: true,
      userId: data.userId,
      sentAt: new Date(),
    };
  }

  /**
   * Handle email notification
   */
  private async handleEmailNotification(data: EmailNotificationJob, job: Job) {
    this.logger.log(`Sending email to ${data.to}`);

    await job.updateProgress(20);

    try {
      // Use existing email service
      switch (data.template) {
        case 'welcome':
          await this.emailService.sendWelcomeEmail({
            to: data.to,
            name: data.context.name || 'User',
          });
          break;

        case 'verification':
          await this.emailService.sendEmailVerification({
            to: data.to,
            name: data.context.name || 'User',
            verificationToken: data.context.token || '',
          });
          break;

        case 'password-reset':
          await this.emailService.sendPasswordReset({
            to: data.to,
            name: data.context.name || 'User',
            resetToken: data.context.token || '',
          });
          break;

        default:
          this.logger.warn(`Unknown email template: ${data.template}`);
      }

      await job.updateProgress(100);

      return {
        success: true,
        to: data.to,
        template: data.template,
        sentAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${data.to}:`, error);
      throw error;
    }
  }

  /**
   * Handle SMS notification
   */
  private async handleSMSNotification(data: SMSNotificationJob, job: Job) {
    this.logger.log(`Sending SMS to ${data.phoneNumber}`);

    await job.updateProgress(30);

    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    // Example implementation:
    // await this.smsService.send(data.phoneNumber, data.message);

    await job.updateProgress(100);

    return {
      success: true,
      phoneNumber: data.phoneNumber,
      sentAt: new Date(),
    };
  }

  /**
   * Handle bulk notification
   */
  private async handleBulkNotification(data: BulkNotificationJob, job: Job) {
    this.logger.log(`Sending bulk notification to ${data.userIds.length} users`);

    const total = data.userIds.length;
    const results = [];

    for (let i = 0; i < total; i++) {
      const userId = data.userIds[i];

      try {
        // Send notification based on channel
        if (data.channel === 'push' || data.channel === 'all') {
          // Send push notification
          // await this.pushService.send(userId, data.title, data.message);
        }

        results.push({ userId, success: true });
      } catch (error) {
        this.logger.error(`Failed to send notification to user ${userId}:`, error);
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? error.message
            : 'Unknown error';
        results.push({ userId, success: false, error: errorMessage });
      }

      // Update progress
      await job.updateProgress(Math.floor(((i + 1) / total) * 100));
    }

    return {
      total,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, _result: any) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts:`, error.message);

    // Check if this is the final failure
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      this.logger.error(`Job ${job.id} moved to Dead Letter Queue`);
      // TODO: Alert admin or store in DLQ table
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} started processing`);
  }
}
