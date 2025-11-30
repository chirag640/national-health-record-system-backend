import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { filterApiResponse } from './field-filter.util';
import { FIELD_ACCESS_KEY, FieldAccessConfig } from './field-access.decorator';
import { FieldAccessService } from './field-access.service';
import { AccessAction } from './field-access-rule.schema';

/**
 * Field Access Interceptor
 *
 * Automatically filters response data based on user role and field access policies.
 * Applied globally or per-controller/per-route.
 *
 * This is the MAIN enforcement point for FLAC.
 *
 * How it works:
 * 1. Request comes in
 * 2. Controller executes
 * 3. BEFORE response is sent, this interceptor runs
 * 4. Filters out unauthorized fields
 * 5. Returns sanitized response
 *
 * Usage in main.ts:
 *   app.useGlobalInterceptors(new FieldAccessInterceptor(app.get(Reflector)));
 */

@Injectable()
export class FieldAccessInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly fieldAccessService: FieldAccessService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Get FLAC configuration from decorator
    const flacConfig = this.reflector.get<FieldAccessConfig>(
      FIELD_ACCESS_KEY,
      context.getHandler(),
    );

    // Skip FLAC if explicitly disabled
    if (flacConfig?.skipFlac) {
      return next.handle();
    }

    // Get request context
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user (unauthenticated), treat as 'public' role
    const role = user?.role || 'public';
    const userId = user?.id || user?._id;

    // Get entity name from decorator or request
    const entityName = flacConfig?.entityName;

    // Process the response
    return next.handle().pipe(
      map((data) => {
        // Skip if no data
        if (!data) return data;

        // Create audit log function
        const auditLog = (message: string) => {
          this.fieldAccessService.logAccess({
            userId: String(userId || 'anonymous'),
            role,
            entityName: entityName || 'Unknown',
            action: this.getActionFromMethod(request.method),
            deniedFields: this.extractDeniedFields(message),
            granted: !message.includes('denied'),
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            metadata: {
              endpoint: request.url,
              method: request.method,
            },
          });
        };

        // Apply field filtering
        const filtered = filterApiResponse(role, data, {
          userId: String(userId),
          entityName,
          logDenied: flacConfig?.enableAudit ?? true,
          auditLog: flacConfig?.enableAudit ? auditLog : undefined,
        });

        // Apply custom overrides from decorator
        if (flacConfig?.customDeny && flacConfig.customDeny.length > 0) {
          return this.applyCustomDeny(filtered, flacConfig.customDeny);
        }

        return filtered;
      }),
    );
  }

  /**
   * Get action type from HTTP method
   */
  private getActionFromMethod(method: string): AccessAction {
    switch (method.toUpperCase()) {
      case 'GET':
        return AccessAction.READ;
      case 'DELETE':
        return AccessAction.DELETE;
      default:
        return AccessAction.WRITE;
    }
  }

  /**
   * Extract denied fields from audit message
   */
  private extractDeniedFields(message: string): string[] {
    const match = message.match(/Fields denied.*?: (.+)/);
    if (match && match[1]) {
      return match[1].split(', ').map((f) => f.trim());
    }
    return [];
  }

  /**
   * Apply custom deny rules
   */
  private applyCustomDeny(data: any, denyFields: string[]): any {
    if (!data || typeof data !== 'object') return data;

    const cloned = JSON.parse(JSON.stringify(data));

    for (const field of denyFields) {
      const _ = require('lodash');
      _.unset(cloned, field);
    }

    return cloned;
  }
}

/**
 * Standalone function to manually filter data in services
 *
 * Use when you need to filter data programmatically outside of HTTP responses
 */
export function applyFieldAccess(role: string, data: any, options = {}) {
  return filterApiResponse(role, data, options);
}
