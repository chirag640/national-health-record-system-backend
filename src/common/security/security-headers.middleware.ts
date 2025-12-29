import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Security Headers Middleware
 * Adds additional security headers beyond what Helmet provides
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    // Permissions Policy (formerly Feature-Policy)
    res.setHeader(
      'Permissions-Policy',
      [
        'accelerometer=()',
        'camera=()',
        'geolocation=(self)',
        'gyroscope=()',
        'magnetometer=()',
        'microphone=()',
        'payment=()',
        'usb=()',
      ].join(', '),
    );

    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Cache control for sensitive data
    if (req.path.includes('/auth/') || req.path.includes('/patients/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    // HSTS (only in production with HTTPS)
    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Remove server identification
    res.removeHeader('X-Powered-By');

    // Add request ID for tracing
    const requestId =
      req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-Id', requestId);
    (req as any).requestId = requestId;

    next();
  }
}
