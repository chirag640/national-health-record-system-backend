import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

@Injectable()
export class SuccessResponseInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = request.headers['x-request-id'] as string;

    return next.handle().pipe(
      map((data) => {
        const timestamp = new Date().toISOString();

        // Handle pagination metadata if present
        let pagination;
        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          pagination = (data as any).meta;
          data = (data as any).items;
        }

        return {
          success: true,
          data,
          meta: {
            timestamp,
            requestId,
            ...(pagination && { pagination }),
          },
        };
      }),
    );
  }
}
