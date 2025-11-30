import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'nestjs-pino';

/**
 * Logging interceptor for enhanced request/response logging
 * Logs request start, completion time, and errors
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const startTime = Date.now();

    this.logger.log({
      msg: `Incoming Request: ${method} ${url}`,
      method,
      url,
    });

    return next.handle().pipe(
      tap({
        next: (_data) => {
          const responseTime = Date.now() - startTime;
          this.logger.log({
            msg: `Request Completed: ${method} ${url}`,
            method,
            url,
            responseTime: `${responseTime}ms`,
          });
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          this.logger.error({
            msg: `Request Failed: ${method} ${url}`,
            method,
            url,
            responseTime: `${responseTime}ms`,
            error: error.message,
            stack: error.stack,
          });
        },
      }),
    );
  }
}
