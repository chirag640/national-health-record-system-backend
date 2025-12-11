import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * HTTP Cache Interceptor
 * Caches GET requests automatically
 *
 * Usage:
 * @UseInterceptors(HttpCacheInterceptor)
 * @Get()
 * findAll() { ... }
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Skip caching for authenticated requests
    const authHeader = request.headers['authorization'] || request.headers['cookie'];
    if (authHeader) {
      return next.handle();
    }

    // Generate cache key including relevant headers
    const acceptLanguage = request.headers['accept-language'] || '';
    const acceptEncoding = request.headers['accept-encoding'] || '';
    const cacheKey = `http:${url}:${acceptLanguage}:${acceptEncoding}`;

    // Check cache
    const cachedResponse = await this.cacheManager.get(cacheKey);
    if (cachedResponse) {
      return of(cachedResponse);
    }

    // Cache miss - execute request and cache response
    const CACHE_TTL = 300; // 5 minutes in seconds (cache-manager v4/v5)
    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.cacheManager.set(cacheKey, response, CACHE_TTL * 1000); // Convert to ms for v5
        } catch (error: any) {
          const err = error as Error;
          console.error(`Failed to cache response for ${cacheKey}:`, err.message);
        }
      }),
    );
  }
}
