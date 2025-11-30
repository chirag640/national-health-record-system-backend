import { Injectable, NestMiddleware, RequestTimeoutException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TimeoutMiddleware implements NestMiddleware {
  constructor(private readonly timeoutMs: number = 30000) {}

  use(_req: Request, res: Response, next: NextFunction) {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        throw new RequestTimeoutException('Request timeout exceeded');
      }
    }, this.timeoutMs);

    res.on('finish', () => clearTimeout(timeoutId));
    res.on('close', () => clearTimeout(timeoutId));

    next();
  }
}
