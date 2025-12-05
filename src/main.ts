import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import { VersioningType } from '@nestjs/common';
import { setupSwagger } from './config/swagger.config';
import cookieParser from 'cookie-parser';
import { validateEnv } from './env.schema';

async function bootstrap() {
  // Suppress Redis connection errors when Redis is not available
  process.on('unhandledRejection', (reason: any) => {
    if (
      reason?.code === 'ECONNREFUSED' ||
      reason?.message?.includes('Connection is closed') ||
      reason?.errors?.some((e: any) => e.code === 'ECONNREFUSED')
    ) {
      // Silently ignore Redis connection errors - queues will work when Redis is available
      return;
    }
    // Log other unhandled rejections
    console.error('Unhandled Rejection:', reason);
  });

  // Validate environment variables before starting
  validateEnv();

  // Critical: Validate JWT_SECRET is set before starting the application
  if (!process.env.JWT_SECRET) {
    throw new Error(
      '❌ FATAL: JWT_SECRET environment variable is not set!\n' +
        'Application cannot start without JWT_SECRET.\n' +
        'Please set JWT_SECRET in your .env file to a strong secret (minimum 32 characters).\n' +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.warn(
      '⚠️  WARNING: JWT_SECRET is shorter than 32 characters. Consider using a longer secret for better security.',
    );
  }

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Pino logger for structured logging
  app.useLogger(app.get(Logger));

  // Set global API prefix for better API organization
  app.setGlobalPrefix('api');

  // Enable URI-based API versioning (e.g., /v1/users, /v2/users)
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Security: HTTP headers protection
  app.use(helmet());

  // Performance: Gzip compression
  app.use(compression());

  // Enable cookie parsing (required for CSRF protection and session management)
  app.use(cookieParser());

  // CSRF Protection (optional - enable via ENABLE_CSRF=true environment variable)
  // Note: For stateless JWT APIs, CSRF is often not needed
  // Enable this for traditional session-based authentication or when using cookies for auth tokens
  if (process.env.ENABLE_CSRF === 'true') {
    const { CsrfMiddleware } = await import('./common/csrf.middleware');
    app.use(new CsrfMiddleware().use.bind(new CsrfMiddleware()));
    const logger = app.get(Logger);
    logger.log('🛡️  CSRF protection enabled');
  }

  // Enable CORS for cross-origin requests
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Security: Configurable request body size limits to prevent DoS attacks
  // Default: 1mb (increase via REQUEST_BODY_LIMIT env var if needed for file uploads)
  const bodyLimit = process.env.REQUEST_BODY_LIMIT || '1mb';
  app.use(require('express').json({ limit: bodyLimit }));
  app.use(require('express').urlencoded({ limit: bodyLimit, extended: true }));

  // Enable validation globally with DTO decorators
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable input sanitization to prevent XSS attacks
  const { SanitizationPipe } = await import('./common/sanitization.pipe');
  app.useGlobalPipes(new SanitizationPipe());

  // Register global exception filter for standardized error responses (production-ready)
  const { GlobalExceptionFilter } = await import('./common/global-exception.filter');
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Register success response interceptor for consistent API responses
  const { SuccessResponseInterceptor } = await import('./common/success-response.interceptor');
  app.useGlobalInterceptors(new SuccessResponseInterceptor());

  // Register logging interceptor for automatic request/response logging with PII sanitization
  const { LoggingInterceptor } = await import('./common/logging.interceptor');
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Register audit logging interceptor for legal compliance (tracks all data access)
  const { AuditLogInterceptor } = await import('./common/audit-log.interceptor');
  const { getModelToken } = await import('@nestjs/mongoose');
  const auditLogModel = app.get(getModelToken('AuditLog'));
  app.useGlobalInterceptors(new AuditLogInterceptor(auditLogModel));

  // Register translation interceptor for multilingual error messages (English, Hindi, Gujarati)
  const { TranslationInterceptor } = await import('./common/translation.interceptor');
  const { I18nService } = await import('nestjs-i18n');
  const i18nService = app.get(I18nService);
  app.useGlobalInterceptors(new TranslationInterceptor(i18nService as any));

  // Note: Optional interceptors commented out - uncomment if implementing these features
  // const { ResponseValidationInterceptor } = await import('./common/response-validation.interceptor');
  // const { Reflector } = await import('@nestjs/core');
  // app.useGlobalInterceptors(new ResponseValidationInterceptor(app.get(Reflector)));
  // const { DeprecatedInterceptor } = await import('./common/deprecated.interceptor');
  // app.useGlobalInterceptors(new DeprecatedInterceptor(app.get(Reflector)));
  // const { MetricsInterceptor } = await import('./common/metrics.interceptor');
  // const { MetricsService } = await import('./features/metrics/metrics.service');
  // app.useGlobalInterceptors(new MetricsInterceptor(app.get(MetricsService)));

  // Register request ID middleware for distributed tracing
  const { RequestIdMiddleware } = await import('./common/request-id.middleware');
  app.use(new RequestIdMiddleware().use.bind(new RequestIdMiddleware()));

  // Register timeout middleware to prevent long-running requests
  const { TimeoutMiddleware } = await import('./common/timeout.middleware');
  app.use(new TimeoutMiddleware(30000).use.bind(new TimeoutMiddleware(30000))); // 30 second timeout

  // Setup Swagger API documentation at /api/docs
  setupSwagger(app);

  await app.init();

  return app;
}

async function startServer() {
  const app = await bootstrap();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Enable graceful shutdown for containerized environments
  app.enableShutdownHooks();

  const logger = app.get(Logger);
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation available at: http://localhost:${port}/api/docs`);
  logger.log(`❤️  Health check available at: http://localhost:${port}/health`);

  // Handle graceful shutdown on SIGTERM and SIGINT
  process.on('SIGTERM', async () => {
    logger.log('⚠️  SIGTERM signal received: closing HTTP server gracefully');
    await app.close();
    logger.log('✅ HTTP server closed successfully');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('⚠️  SIGINT signal received: closing HTTP server gracefully');
    await app.close();
    logger.log('✅ HTTP server closed successfully');
    process.exit(0);
  });
}

// For local development and Docker
if (require.main === module) {
  startServer();
}

// For Vercel serverless - cache the app instance
let cachedApp: any = null;

export default async (req: any, res: any) => {
  if (!cachedApp) {
    cachedApp = await bootstrap();
  }
  const expressApp = cachedApp.getHttpAdapter().getInstance();
  return expressApp(req, res);
};
