import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly cookieName = 'XSRF-TOKEN';
  private readonly headerName = 'x-csrf-token';
  private readonly safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF check for safe methods
    if (this.safeMethods.includes(req.method)) {
      // Generate and set CSRF token for safe requests
      const token = this.generateToken();
      res.cookie(this.cookieName, token, {
        httpOnly: false, // Allow JavaScript access for sending in headers
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000, // 1 hour
      });
      return next();
    }

    // For state-changing requests, validate CSRF token
    const tokenFromHeader = req.headers[this.headerName] as string;
    const tokenFromCookie = req.cookies[this.cookieName];

    if (!tokenFromHeader || !tokenFromCookie) {
      throw new ForbiddenException({
        code: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token is missing',
      });
    }

    if (tokenFromHeader !== tokenFromCookie) {
      throw new ForbiddenException({
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid CSRF token',
      });
    }

    next();
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
