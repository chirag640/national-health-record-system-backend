import { Module } from '@nestjs/common';
import { ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    NestThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): any => {
        // Using in-memory storage (WARNING: not suitable for multi-instance deployments)
        // Enable caching feature to use Redis-based rate limiting
        return {
          throttlers: [
            {
              ttl: configService.get<number>('THROTTLE_TTL') || 60000, // Time window in milliseconds (default: 1 minute)
              limit: configService.get<number>('THROTTLE_LIMIT') || 10, // Max requests per window (default: 10)
            },
          ],
        };
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [NestThrottlerModule],
})
export class ThrottlerModule {}
