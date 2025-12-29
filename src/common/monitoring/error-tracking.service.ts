import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PIISanitizerService } from '../security/pii-sanitizer.service';

// Sentry types - optional dependency
interface SentryModule {
  init: (options: any) => void;
  captureException: (error: Error, options?: any) => string;
  captureMessage: (message: string, level?: string) => string;
  setUser: (user: any) => void;
  addBreadcrumb: (breadcrumb: any) => void;
  startSpan: (options: any, callback: () => void) => any;
  flush: (timeout: number) => Promise<boolean>;
  httpIntegration: () => any;
}

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

/**
 * Error Tracking Service
 * Provides centralized error tracking with PII sanitization for HIPAA compliance
 * Uses Sentry if available and configured, otherwise falls back to logging
 */
@Injectable()
export class ErrorTrackingService implements OnModuleInit {
  private readonly logger = new Logger(ErrorTrackingService.name);
  private initialized = false;
  private sentry: SentryModule | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly piiSanitizer: PIISanitizerService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  private async initialize(): Promise<void> {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    const environment = this.configService.get<string>('NODE_ENV', 'development');

    if (!dsn) {
      this.logger.warn('Sentry DSN not configured - error tracking will use console logging');
      return;
    }

    try {
      // Try to dynamically import Sentry
      const Sentry = await this.loadSentry();
      if (!Sentry) {
        this.logger.warn('@sentry/node not installed - error tracking will use console logging');
        return;
      }

      this.sentry = Sentry;

      Sentry.init({
        dsn,
        environment,
        release: this.configService.get<string>('APP_VERSION', '1.0.0'),

        // Healthcare-specific sampling - be more aggressive in production
        tracesSampleRate: environment === 'production' ? 0.1 : 0.5,
        profilesSampleRate: environment === 'production' ? 0.1 : 0.5,

        // Don't send PII to Sentry - HIPAA compliance
        beforeSend: (event: any, _hint: any) => this.sanitizeEvent(event),
        beforeSendTransaction: (transaction: any) => this.sanitizeTransaction(transaction),

        // Integrate with NestJS logging
        integrations: [Sentry.httpIntegration()],

        // Ignore common non-error events
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection captured',
          /^Timeout expired/,
          /^ETIMEDOUT/,
          /^ECONNREFUSED/,
        ],

        // Data scrubbing for healthcare compliance
        beforeBreadcrumb: (breadcrumb: any) => {
          if (breadcrumb.data) {
            breadcrumb.data = this.piiSanitizer.sanitizeObject(breadcrumb.data) as Record<
              string,
              any
            >;
          }
          return breadcrumb;
        },
      });

      this.initialized = true;
      this.logger.log('✅ Sentry error tracking initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Sentry', error);
    }
  }

  /**
   * Dynamically load Sentry module
   */
  private async loadSentry(): Promise<SentryModule | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sentry = require('@sentry/node');
      return Sentry;
    } catch {
      return null;
    }
  }

  /**
   * Capture exception with context
   */
  captureException(error: Error, context?: Record<string, any>): string | undefined {
    const sanitizedContext = context ? this.piiSanitizer.sanitizeObject(context) : undefined;

    if (!this.initialized || !this.sentry) {
      this.logger.error('Error captured:', {
        message: error.message,
        stack: error.stack,
        context: sanitizedContext,
      });
      return undefined;
    }

    return this.sentry.captureException(error, {
      extra: sanitizedContext as Record<string, any>,
    });
  }

  /**
   * Capture message
   */
  captureMessage(message: string, level: SeverityLevel = 'info'): string | undefined {
    // Sanitize message content
    const sanitizedMessage = this.piiSanitizer.sanitizeString(message);

    if (!this.initialized || !this.sentry) {
      this.logger.log(`[${level.toUpperCase()}] ${sanitizedMessage}`);
      return undefined;
    }

    return this.sentry.captureMessage(sanitizedMessage, level);
  }

  /**
   * Set user context (sanitized)
   */
  setUser(user: { id: string; email?: string; role?: string }): void {
    if (!this.initialized || !this.sentry) {
      return;
    }

    this.sentry.setUser({
      id: user.id,
      // Only include role, not email for HIPAA compliance
      role: user.role,
    });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.initialized || !this.sentry) {
      return;
    }
    this.sentry.setUser(null);
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: SeverityLevel;
    data?: Record<string, any>;
  }): void {
    if (!this.initialized || !this.sentry) {
      return;
    }

    this.sentry.addBreadcrumb({
      message: this.piiSanitizer.sanitizeString(breadcrumb.message),
      category: breadcrumb.category,
      level: breadcrumb.level,
      data: breadcrumb.data
        ? (this.piiSanitizer.sanitizeObject(breadcrumb.data) as Record<string, any>)
        : undefined,
    });
  }

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(name: string, op: string): any {
    if (!this.initialized || !this.sentry) {
      return null;
    }

    return this.sentry.startSpan({ name, op }, () => {});
  }

  /**
   * Flush all pending events before shutdown
   */
  async flush(timeout = 2000): Promise<boolean> {
    if (!this.initialized || !this.sentry) {
      return true;
    }
    return this.sentry.flush(timeout);
  }

  /**
   * Sanitize event before sending - CRITICAL for HIPAA
   */
  private sanitizeEvent(event: any): any | null {
    // Sanitize exception messages
    if (event.exception?.values) {
      event.exception.values = event.exception.values.map((exception: any) => ({
        ...exception,
        value: exception.value
          ? this.piiSanitizer.sanitizeString(exception.value)
          : exception.value,
      }));
    }

    // Sanitize request data
    if (event.request) {
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-auth-token'];
      }
      if (event.request.data) {
        event.request.data = this.piiSanitizer.sanitizeObject(
          typeof event.request.data === 'string' ? { raw: event.request.data } : event.request.data,
        );
      }
      // Don't send query strings - may contain sensitive data
      delete event.request.query_string;
    }

    // Sanitize extra data
    if (event.extra) {
      event.extra = this.piiSanitizer.sanitizeObject(event.extra) as Record<string, any>;
    }

    // Sanitize contexts
    if (event.contexts) {
      event.contexts = this.piiSanitizer.sanitizeObject(event.contexts);
    }

    // Remove user email, keep only ID and role
    if (event.user) {
      event.user = {
        id: event.user.id,
      };
    }

    return event;
  }

  /**
   * Sanitize transaction data
   */
  private sanitizeTransaction(transaction: any): any | null {
    // Remove sensitive request data from transactions
    if (transaction.request?.data) {
      transaction.request.data = '[Sanitized]';
    }

    if (transaction.request?.headers) {
      delete transaction.request.headers['authorization'];
      delete transaction.request.headers['cookie'];
    }

    return transaction;
  }
}

/**
 * Global exception filter for NestJS
 */
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly errorTracking: ErrorTrackingService) {}

  catch(exception: Error | HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Only track server errors (5xx)
    if (status >= 500) {
      this.errorTracking.captureException(exception, {
        url: request.url,
        method: request.method,
        statusCode: status,
        userId: (request as any).user?.sub,
      });
    }

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
