import { NestFactory } from '@nestjs/core';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from '../modules/queue/queue.module';

/**
 * Dedicated Worker Module - Only includes queue processing
 * Use this for separate worker processes
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    QueueModule,
  ],
})
class WorkerModule {}

async function bootstrap() {
  const logger = new Logger('DedicatedWorker');

  logger.log('🚀 Starting Dedicated Queue Worker...');

  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableShutdownHooks();

  logger.log('✅ Dedicated Worker started');
  logger.log('🔄 Processing jobs from: notifications, documents, sync, analytics, cleanup');

  // Graceful shutdown
  process.on('SIGTERM', () => {
    void (async () => {
      logger.log('⚠️  SIGTERM received');
      await app.close();
      process.exit(0);
    })();
  });

  process.on('SIGINT', () => {
    void (async () => {
      logger.log('\u26a0\ufe0f  SIGINT received');
      await app.close();
      process.exit(0);
    })();
  });
}

void bootstrap();
