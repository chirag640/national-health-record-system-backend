export interface FollowUpReminderJob {
  appointmentId: string;
  workerId: string;
  workerName: string;
  workerPhone?: string;
  reminderDate: Date;
  appointmentType: string;
  additionalNotes?: string;
}

export interface PushNotificationJob {
  userId: string;
  title: string;
  message: string;
  data?: Record<string, string>;
  deviceTokens?: string[];
  imageUrl?: string;
  priority: 'high' | 'normal' | 'low';
}

export interface EmailNotificationJob {
  to: string;
  subject: string;
  template: 'welcome' | 'verification' | 'password-reset' | 'appointment-reminder' | 'custom';
  context: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

export interface SMSNotificationJob {
  phoneNumber: string;
  message: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface BulkNotificationJob {
  userIds: string[];
  title: string;
  message: string;
  channel: 'push' | 'email' | 'sms' | 'all';
  priority: 'high' | 'normal' | 'low';
}
