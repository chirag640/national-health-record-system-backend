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
        // Using in-memory storage (works for single-instance deployments)
        // For multi-instance/cluster deployments, configure Redis storage via CACHE_STORE_REDIS=true
        return {
          throttlers: [
            {
              name: 'default',
              ttl: configService.get<number>('THROTTLE_TTL') || 60000, // 60 seconds (1 minute)
              limit: configService.get<number>('THROTTLE_LIMIT') || 100, // 100 requests per minute (production-ready default)
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
