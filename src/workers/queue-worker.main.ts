import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';

/**
 * Worker Module - Minimal NestJS application for processing queue jobs
 * This runs alongside the main API or as a separate process
 */
async function bootstrap() {
  const logger = new Logger('QueueWorker');

  logger.log('🔧 Starting Queue Worker...');

  // Create application context (no HTTP server)
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Enable graceful shutdown
  app.enableShutdownHooks();

  logger.log('✅ Queue Worker started successfully');
  logger.log('📊 BullBoard UI available at: http://localhost:3000/admin/queues');
  logger.log('🔄 Processing jobs from all queues...');

  // Handle process signals
  process.on('SIGTERM', () => {
    void (async () => {
      logger.log('⚠️  SIGTERM received, shutting down gracefully...');
      await app.close();
      logger.log('✅ Worker shut down complete');
      process.exit(0);
    })();
  });

  process.on('SIGINT', () => {
    void (async () => {
      logger.log('⚠️  SIGINT received, shutting down gracefully...');
      await app.close();
      logger.log('✅ Worker shut down complete');
      process.exit(0);
    })();
  });
}

bootstrap().catch((error) => {
  console.error('❌ Worker failed to start:', error);
  process.exit(1);
});
