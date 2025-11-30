import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  private readonly slowThreshold = parseInt(process.env.SLOW_ROUTE_THRESHOLD || '500', 10);

  private readonly sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'authorization',
    'cookie',
    'ssn',
    'creditCard',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, headers, query } = request;
    const requestId = headers['x-request-id'] as string;
    const startTime = Date.now();

    // Sanitize request body
    const sanitizedBody = this.sanitize(body);
    const sanitizedQuery = this.sanitize(query);

    this.logger.log({
      type: 'REQUEST',
      requestId,
      method,
      url,
      body: sanitizedBody,
      query: sanitizedQuery,
      userAgent: headers['user-agent'],
      ip: request.ip,
      userId: (request as any).user?.id,
    });

    return next.handle().pipe(
      tap({
        next: (_data) => {
          const duration = Date.now() - startTime;

          // Check if route is slow
          if (duration > this.slowThreshold) {
            this.logger.warn({
              type: 'SLOW_ROUTE',
              requestId,
              method,
              url,
              statusCode: response.statusCode,
              duration: `${duration}ms`,
              threshold: `${this.slowThreshold}ms`,
              userId: (request as any).user?.id,
              message: `⚠️ Slow route detected: ${method} ${url} took ${duration}ms (threshold: ${this.slowThreshold}ms)`,
            });
          } else {
            this.logger.log({
              type: 'RESPONSE',
              requestId,
              method,
              url,
              statusCode: response.statusCode,
              duration: `${duration}ms`,
              userId: (request as any).user?.id,
            });
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error({
            type: 'ERROR_RESPONSE',
            requestId,
            method,
            url,
            statusCode: error.status || 500,
            duration: `${duration}ms`,
            error: error.message,
            userId: (request as any).user?.id,
          });
        },
      }),
    );
  }

  private sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (this.sensitiveFields.some((field) => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
