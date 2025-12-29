import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitConfig {
  /** Time window in seconds */
  windowSec: number;
  /** Maximum requests per window */
  maxRequests: number;
  /** Optional: Different limit for authenticated users */
  maxRequestsAuthenticated?: number;
  /** Optional: Skip rate limiting for certain roles */
  skipRoles?: string[];
}

/**
 * Custom rate limiting decorator
 * Usage: @RateLimit({ windowSec: 60, maxRequests: 10 })
 */
export const RateLimit = (config: RateLimitConfig) => {
  return (target: any, _propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(RATE_LIMIT_KEY, config, descriptor?.value || target);
    return descriptor || target;
  };
};

/**
 * In-memory rate limiter with sliding window
 * For production, use Redis-based implementation
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly store = new Map<string, { count: number; resetTime: number }>();

  // Cleanup interval (5 minutes)
  private readonly cleanupInterval = 5 * 60 * 1000;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    // Periodic cleanup of expired entries
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<RateLimitConfig>(RATE_LIMIT_KEY, context.getHandler());

    // If no rate limit config, check class-level or use defaults
    const classConfig = this.reflector.get<RateLimitConfig>(RATE_LIMIT_KEY, context.getClass());

    const effectiveConfig = config || classConfig || this.getDefaultConfig();

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.generateKey(request);
    const user = (request as any).user;

    // Skip rate limiting for certain roles
    if (user?.role && effectiveConfig.skipRoles?.includes(user.role)) {
      return true;
    }

    // Determine max requests based on authentication
    const maxRequests =
      user && effectiveConfig.maxRequestsAuthenticated
        ? effectiveConfig.maxRequestsAuthenticated
        : effectiveConfig.maxRequests;

    const now = Date.now();
    const windowMs = effectiveConfig.windowSec * 1000;
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      // New window
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      this.setRateLimitHeaders(context, maxRequests, maxRequests - 1, now + windowMs);
      return true;
    }

    if (record.count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      this.setRateLimitHeaders(context, maxRequests, 0, record.resetTime);

      this.logger.warn(`Rate limit exceeded for key: ${key}`);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    record.count++;
    this.setRateLimitHeaders(context, maxRequests, maxRequests - record.count, record.resetTime);
    return true;
  }

  private generateKey(request: Request): string {
    const user = (request as any).user;
    const ip = this.getClientIp(request);
    const path = request.path;

    // Use user ID for authenticated requests, IP for anonymous
    const identifier = user?.sub || user?._id || ip;
    return `ratelimit:${path}:${identifier}`;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      const firstIp = forwarded.split(',')[0];
      return firstIp?.trim() || 'unknown';
    }
    return request.ip || 'unknown';
  }

  private setRateLimitHeaders(
    context: ExecutionContext,
    limit: number,
    remaining: number,
    resetTime: number,
  ): void {
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
    response.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
  }

  private getDefaultConfig(): RateLimitConfig {
    return {
      windowSec: parseInt(this.configService.get('THROTTLE_TTL', '60000')) / 1000,
      maxRequests: parseInt(this.configService.get('THROTTLE_LIMIT', '100')),
      maxRequestsAuthenticated: parseInt(this.configService.get('THROTTLE_LIMIT', '100')) * 2,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }
}
