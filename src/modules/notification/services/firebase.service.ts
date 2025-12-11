import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

/**
 * Firebase Cloud Messaging Service
 * Handles push notifications to mobile devices (Android/iOS)
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n'); // Handle escaped newlines
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn(
          'Firebase credentials not configured. Push notifications will not work. ' +
            'Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables.',
        );
        return;
      }

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error: any) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
      this.firebaseApp = null;
    }
  }

  /**
   * Send push notification to a single device
   */
  async sendToDevice(
    deviceToken: string,
    notification: {
      title: string;
      body: string;
      imageUrl?: string;
    },
    data?: Record<string, string>,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Skipping push notification.');
      return { success: false, error: 'Firebase not configured' };
    }

    try {
      const message: admin.messaging.Message = {
        token: deviceToken,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'health_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Push notification sent successfully. Message ID: ${response}`);

      return { success: true, messageId: response };
    } catch (error: any) {
      this.logger.error(`Failed to send push notification to ${deviceToken}:`, error);
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultipleDevices(
    deviceTokens: string[],
    notification: {
      title: string;
      body: string;
      imageUrl?: string;
    },
    data?: Record<string, string>,
  ): Promise<{
    success: boolean;
    successCount: number;
    failureCount: number;
    responses: Array<{ success: boolean; messageId?: string; error?: string }>;
  }> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Skipping push notifications.');
      return {
        success: false,
        successCount: 0,
        failureCount: deviceTokens.length,
        responses: deviceTokens.map(() => ({ success: false, error: 'Firebase not configured' })),
      };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: deviceTokens,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'health_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `Multicast push notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`,
      );

      const results = response.responses.map((res) => {
        if (res.success) {
          return { success: true, messageId: res.messageId };
        } else {
          return { success: false, error: res.error?.message || 'Unknown error' };
        }
      });

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: results,
      };
    } catch (error: any) {
      this.logger.error('Failed to send multicast push notification:', error);
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Unknown error';

      return {
        success: false,
        successCount: 0,
        failureCount: deviceTokens.length,
        responses: deviceTokens.map(() => ({ success: false, error: errorMessage })),
      };
    }
  }

  /**
   * Send push notification to a topic (for broadcasting)
   */
  async sendToTopic(
    topic: string,
    notification: {
      title: string;
      body: string;
      imageUrl?: string;
    },
    data?: Record<string, string>,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Skipping push notification.');
      return { success: false, error: 'Firebase not configured' };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'health_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Push notification sent to topic ${topic}. Message ID: ${response}`);

      return { success: true, messageId: response };
    } catch (error: any) {
      this.logger.error(`Failed to send push notification to topic ${topic}:`, error);
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Subscribe devices to a topic
   */
  async subscribeToTopic(
    deviceTokens: string[],
    topic: string,
  ): Promise<{ success: boolean; successCount: number; failureCount: number }> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Cannot subscribe to topic.');
      return { success: false, successCount: 0, failureCount: deviceTokens.length };
    }

    try {
      const response = await admin.messaging().subscribeToTopic(deviceTokens, topic);
      this.logger.log(
        `Subscribed devices to topic ${topic}. Success: ${response.successCount}, Failure: ${response.failureCount}`,
      );

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error: any) {
      this.logger.error(`Failed to subscribe devices to topic ${topic}:`, error);
      return { success: false, successCount: 0, failureCount: deviceTokens.length };
    }
  }

  /**
   * Unsubscribe devices from a topic
   */
  async unsubscribeFromTopic(
    deviceTokens: string[],
    topic: string,
  ): Promise<{ success: boolean; successCount: number; failureCount: number }> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Cannot unsubscribe from topic.');
      return { success: false, successCount: 0, failureCount: deviceTokens.length };
    }

    try {
      const response = await admin.messaging().unsubscribeFromTopic(deviceTokens, topic);
      this.logger.log(
        `Unsubscribed devices from topic ${topic}. Success: ${response.successCount}, Failure: ${response.failureCount}`,
      );

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error: any) {
      this.logger.error(`Failed to unsubscribe devices from topic ${topic}:`, error);
      return { success: false, successCount: 0, failureCount: deviceTokens.length };
    }
  }

  /**
   * Check if Firebase is initialized
   */
  isInitialized(): boolean {
    return this.firebaseApp !== null;
  }
}
