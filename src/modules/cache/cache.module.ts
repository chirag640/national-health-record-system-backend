import { Module, Global, Logger } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<any> => {
        const logger = new Logger('CacheModule');
        const redisUrl = configService.get<string>('REDIS_URL');

        if (!redisUrl) {
          logger.warn('⚠️  REDIS_URL not configured, using in-memory cache');
          return {
            ttl: 300000, // 5 minutes default TTL (in milliseconds)
            max: 100, // Maximum number of items in cache
          };
        }

        try {
          // Parse Redis URL
          const url = new URL(redisUrl);

          const store = await redisStore({
            host: url.hostname,
            port: parseInt(url.port || '6379', 10),
            ...(url.password && { password: url.password }),
            ttl: 300, // 5 minutes in seconds

            // Retry strategy: 3 attempts with exponential backoff
            retryStrategy: (times: number) => {
              if (times > 3) {
                logger.error(
                  '❌ Redis connection failed after 3 attempts, falling back to in-memory cache',
                );
                return null; // Stop retrying
              }
              const delay = Math.min(times * 1000, 3000); // Max 3 second delay
              logger.warn(
                `⚠️  Redis connection attempt ${times} failed, retrying in ${delay}ms...`,
              );
              return delay;
            },

            // Connection events
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,

            // Suppress unhandled error events
            lazyConnect: true,
          });

          // Handle Redis connection errors gracefully
          const client = (store as any).client;
          if (client) {
            client.on('error', (err: Error) => {
              logger.error(`Redis connection error: ${err.message}`);
            });

            client.on('connect', () => {
              logger.log('✅ Redis connected successfully');
            });

            client.on('ready', () => {
              logger.log('✅ Redis is ready to accept commands');
            });

            client.on('reconnecting', () => {
              logger.warn('⚠️  Redis reconnecting...');
            });
          }

          return {
            store,
          } as any;
        } catch (error) {
          const err = error as Error;
          logger.error(`Failed to initialize Redis: ${err.message}`);
          logger.warn('⚠️  Falling back to in-memory cache');

          // Fallback to in-memory cache
          return {
            ttl: 300000, // 5 minutes default TTL (in milliseconds)
            max: 100, // Maximum number of items in cache
          };
        }
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
