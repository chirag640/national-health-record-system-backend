import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobsOptions } from 'bullmq';

export interface RetryStrategy {
  attempts: number;
  backoff: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}

export interface QueuePriority {
  CRITICAL: number;
  HIGH: number;
  NORMAL: number;
  LOW: number;
}

@Injectable()
export class QueueConfigService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Job Priorities
   */
  readonly PRIORITY: QueuePriority = {
    CRITICAL: 1, // User-facing, immediate
    HIGH: 2, // Important, near-realtime
    NORMAL: 5, // Standard processing
    LOW: 10, // Background, can be delayed
  };

  /**
   * Get retry strategy for different job types
   */
  getRetryStrategy(jobType: 'critical' | 'standard' | 'background'): RetryStrategy {
    const strategies = {
      critical: {
        attempts: 5,
        backoff: { type: 'exponential' as const, delay: 1000 }, // 1s, 2s, 4s, 8s, 16s
      },
      standard: {
        attempts: 3,
        backoff: { type: 'exponential' as const, delay: 2000 }, // 2s, 4s, 8s
      },
      background: {
        attempts: 2,
        backoff: { type: 'fixed' as const, delay: 5000 }, // 5s, 5s
      },
    };

    return strategies[jobType];
  }

  /**
   * Get concurrency for a specific queue
   */
  getConcurrency(queueName: string): number {
    const key = `QUEUE_${queueName.toUpperCase()}_CONCURRENCY`;

    const defaults: Record<string, number> = {
      QUEUE_NOTIFICATION_CONCURRENCY: 5,
      QUEUE_DOCUMENT_CONCURRENCY: 3,
      QUEUE_SYNC_CONCURRENCY: 2,
      QUEUE_ANALYTICS_CONCURRENCY: 1,
      QUEUE_CLEANUP_CONCURRENCY: 1,
    };

    return this.configService.get<number>(key, defaults[key] || 1);
  }

  /**
   * Get rate limiting configuration
   */
  getRateLimit(): { max: number; duration: number } {
    return {
      max: this.configService.get<number>('QUEUE_RATE_LIMIT_MAX', 100),
      duration: this.configService.get<number>('QUEUE_RATE_LIMIT_DURATION', 60000), // 1 minute
    };
  }

  /**
   * Build job options with retry strategy
   */
  buildJobOptions(
    priority: number,
    retryType: 'critical' | 'standard' | 'background',
    delay?: number,
    additionalOptions?: Partial<JobsOptions>,
  ): JobsOptions {
    const retryStrategy = this.getRetryStrategy(retryType);

    return {
      priority,
      attempts: retryStrategy.attempts,
      backoff: retryStrategy.backoff,
      ...(delay && { delay }),
      removeOnComplete: true,
      removeOnFail: false, // Keep failed jobs for debugging
      ...additionalOptions,
    };
  }

  /**
   * Calculate delay for scheduled jobs
   */
  calculateDelay(targetDate: Date): number {
    const now = new Date();
    const delay = targetDate.getTime() - now.getTime();
    return Math.max(0, delay);
  }

  /**
   * Get Dead Letter Queue threshold
   */
  getDLQThreshold(): number {
    return this.configService.get<number>('QUEUE_DLQ_THRESHOLD', 100);
  }

  /**
   * Check if queue monitoring is enabled
   */
  isMonitoringEnabled(): boolean {
    return this.configService.get<string>('NODE_ENV') !== 'test';
  }
}
