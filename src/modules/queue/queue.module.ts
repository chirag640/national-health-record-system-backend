import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { EmailModule } from '../../email/email.module';

// Queue Names
export const QUEUE_NAMES = {
  NOTIFICATION: 'notifications',
  DOCUMENT: 'documents',
  SYNC: 'sync',
  ANALYTICS: 'analytics',
  CLEANUP: 'cleanup',
} as const;

// Processors
import { NotificationProcessor } from './processors/notification.processor';
import { DocumentProcessor } from './processors/document.processor';
import { SyncProcessor } from './processors/sync.processor';
import { AnalyticsProcessor } from './processors/analytics.processor';
import { CleanupProcessor } from './processors/cleanup.processor';

// Producers
import { NotificationProducer } from './producers/notification.producer';
import { DocumentProducer } from './producers/document.producer';
import { SyncProducer } from './producers/sync.producer';
import { AnalyticsProducer } from './producers/analytics.producer';
import { CleanupProducer } from './producers/cleanup.producer';

// Queue Configuration
import { QueueConfigService } from './queue.config';

// Check if Redis is configured
const isRedisConfigured = !!(
  process.env.QUEUE_REDIS_URL ||
  process.env.REDIS_URL ||
  process.env.QUEUE_REDIS_HOST
);

if (!isRedisConfigured) {
  console.log('ℹ️  Queue system disabled - Redis not configured');
  console.log('   Queue features (background jobs, notifications) will be unavailable');
  console.log('   To enable: Set QUEUE_REDIS_URL in .env (e.g., redis://localhost:6379/1)');
  console.log('   Start Redis: docker run -d -p 6379:6379 redis:7-alpine');
}

@Global()
@Module({
  imports: [
    EmailModule,
    // Conditionally import BullMQ only if Redis is configured
    ...(isRedisConfigured
      ? [
          // BullMQ Core Configuration
          BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
              const redisUrl =
                configService.get<string>('QUEUE_REDIS_URL') ||
                configService.get<string>('REDIS_URL');

              // Parse Redis URL
              const url = redisUrl ? new URL(redisUrl) : null;

              return {
                connection: url
                  ? {
                      host: url.hostname,
                      port: parseInt(url.port || '6379', 10),
                      ...(url.password && { password: url.password }),
                      db: parseInt(url.pathname?.slice(1) || '1', 10),
                      maxRetriesPerRequest: null,
                      retryStrategy: () => null,
                      enableOfflineQueue: false,
                      lazyConnect: false,
                      reconnectOnError: () => false,
                    }
                  : {
                      host: configService.get<string>('QUEUE_REDIS_HOST', 'localhost'),
                      port: configService.get<number>('QUEUE_REDIS_PORT', 6379),
                      password: configService.get<string>('QUEUE_REDIS_PASSWORD'),
                      db: configService.get<number>('QUEUE_REDIS_DB', 1),
                      maxRetriesPerRequest: null,
                      retryStrategy: () => null,
                      enableOfflineQueue: false,
                      lazyConnect: false,
                      reconnectOnError: () => false,
                    },
                defaultJobOptions: {
                  attempts: configService.get<number>('QUEUE_MAX_RETRY_ATTEMPTS', 3),
                  backoff: {
                    type: configService.get<string>('QUEUE_RETRY_BACKOFF_TYPE', 'exponential') as
                      | 'fixed'
                      | 'exponential',
                    delay: configService.get<number>('QUEUE_RETRY_BACKOFF_DELAY', 2000),
                  },
                  removeOnComplete: {
                    age: 3600 * 24 * configService.get<number>('QUEUE_COMPLETED_RETENTION', 7),
                    count: 1000,
                  },
                  removeOnFail: {
                    age: 3600 * 24 * configService.get<number>('QUEUE_FAILED_RETENTION', 30),
                    count: 5000,
                  },
                },
              };
            },
          }),

          // Register Individual Queues
          BullModule.registerQueue(
            { name: QUEUE_NAMES.NOTIFICATION },
            { name: QUEUE_NAMES.DOCUMENT },
            { name: QUEUE_NAMES.SYNC },
            { name: QUEUE_NAMES.ANALYTICS },
            { name: QUEUE_NAMES.CLEANUP },
          ),

          // BullBoard Monitoring UI
          BullBoardModule.forRoot({
            route: '/admin/queues',
            adapter: ExpressAdapter,
            boardOptions: {
              uiConfig: {
                boardTitle: 'national-health-record-system - Job Queues',
                boardLogo: {
                  path: 'https://cdn.icon-icons.com/icons2/2699/PNG/512/bullmq_logo_icon_168717.png',
                  width: 48,
                  height: 48,
                },
                miscLinks: [
                  { text: 'API Docs', url: '/api/docs' },
                  { text: 'Health Check', url: '/health' },
                ],
              },
            },
          }),
          BullBoardModule.forFeature(
            {
              name: QUEUE_NAMES.NOTIFICATION,
              adapter: BullMQAdapter,
            },
            {
              name: QUEUE_NAMES.DOCUMENT,
              adapter: BullMQAdapter,
            },
            {
              name: QUEUE_NAMES.SYNC,
              adapter: BullMQAdapter,
            },
            {
              name: QUEUE_NAMES.ANALYTICS,
              adapter: BullMQAdapter,
            },
            {
              name: QUEUE_NAMES.CLEANUP,
              adapter: BullMQAdapter,
            },
          ),
        ]
      : []),
  ],
  providers: [
    // Configuration Service
    QueueConfigService,

    // Conditionally provide processors and producers only if Redis is configured
    ...(isRedisConfigured
      ? [
          // Processors (Workers)
          NotificationProcessor,
          DocumentProcessor,
          SyncProcessor,
          AnalyticsProcessor,
          CleanupProcessor,

          // Producers (Job Creators)
          NotificationProducer,
          DocumentProducer,
          SyncProducer,
          AnalyticsProducer,
          CleanupProducer,
        ]
      : []),
  ],
  exports: [
    QueueConfigService,
    ...(isRedisConfigured
      ? [
          BullModule,
          NotificationProducer,
          DocumentProducer,
          SyncProducer,
          AnalyticsProducer,
          CleanupProducer,
        ]
      : []),
  ],
})
export class QueueModule {}
