import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../modules/audit-log/schemas/audit-log.schema';

/**
 * AuditLogInterceptor - Automatically logs all API requests for compliance
 *
 * Logs include:
 * - User who made the request
 * - Action (HTTP method + URL)
 * - Resource accessed
 * - Resource ID
 * - IP address
 * - Request body (sanitized)
 * - Response status
 * - Execution time
 *
 * Applied globally to all controllers
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(@InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const startTime = Date.now();

    // Extract request details
    const method = request.method;
    const url = request.url;
    const resource = this.extractResource(context);
    const resourceId = request.params?.id || request.body?.id;
    const ipAddress = this.extractIp(request);

    // Only log if user is authenticated
    if (!user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (data) => {
          const executionTime = Date.now() - startTime;
          await this.createAuditLog({
            userId: user.userId || user.sub,
            action: `${method} ${url}`,
            resource,
            resourceId,
            ipAddress,
            details: {
              method,
              url,
              body: this.sanitizeBody(request.body),
              query: request.query,
              params: request.params,
              userRole: user.role,
              executionTime: `${executionTime}ms`,
              success: true,
            },
          });
        },
        error: async (error) => {
          const executionTime = Date.now() - startTime;
          await this.createAuditLog({
            userId: user.userId || user.sub,
            action: `${method} ${url}`,
            resource,
            resourceId,
            ipAddress,
            details: {
              method,
              url,
              body: this.sanitizeBody(request.body),
              query: request.query,
              params: request.params,
              userRole: user.role,
              executionTime: `${executionTime}ms`,
              success: false,
              error: error.message,
              errorCode: error.code || error.status,
            },
          });
        },
      }),
    );
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(data: any): Promise<void> {
    try {
      await this.auditLogModel.create(data);
    } catch (error) {
      // Never let audit logging failure break the request
      this.logger.error(`Failed to create audit log: ${error.message}`);
    }
  }

  /**
   * Extract resource name from controller class
   */
  private extractResource(context: ExecutionContext): string {
    const controllerClass = context.getClass().name;
    return controllerClass.replace('Controller', '');
  }

  /**
   * Extract real IP address from request
   */
  private extractIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * Sanitize request body to remove sensitive data
   */
  private sanitizeBody(body: any): any {
    if (!body) return null;

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'secret',
      'apiKey',
      'creditCard',
      'ssn',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
