import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Setup Swagger API documentation
 * Accessible at /api/docs (configurable via SWAGGER_PATH env var)
 *
 * Note: Swagger is now ENABLED by default in all environments (including production)
 * To disable: Set DISABLE_SWAGGER=true environment variable
 */
export function setupSwagger(app: INestApplication): void {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Changed: Swagger is now enabled by default unless explicitly disabled
  const swaggerDisabled = process.env.DISABLE_SWAGGER === 'true';

  if (swaggerDisabled) {
    console.log('📚 Swagger documentation disabled by DISABLE_SWAGGER flag');
    return;
  }

  // Log that Swagger is enabled
  if (!isDevelopment) {
    console.log('📚 Swagger documentation is ENABLED in production');
    console.log('   ⚠️  API documentation is publicly accessible at /api/docs');
    console.log('   To disable: Set DISABLE_SWAGGER=true environment variable');
  }

  // Build description with helpful information
  let description =
    'Patient-centric EHR platform for patients, doctors, and government hospitals with consent control, secure document storage, offline sync, and audit logging.';

  // Add authentication instructions for developers
  if (isDevelopment) {
    description += '\n\n## 🔐 Quick Start - Authentication\n\n';
    description += '**Default Admin Credentials:**\n';
    description += '- **Email:** `admin@national-health-record-system.com`\n';
    description += '- **Password:** `Admin@123456`\n\n';
    description += '**Steps:**\n';
    description += '1. POST to `/api/auth/login` with the credentials above\n';
    description += '2. Copy the `accessToken` from the response\n';
    description += '3. Click the "Authorize" button (top right)\n';
    description += '4. Paste token and click "Authorize"\n';
    description += '5. Your auth is now persisted across page refreshes!\n\n';
    description += '⚠️ **Important:** Change the admin password in production!';
  }

  const config = new DocumentBuilder()
    .setTitle('national-health-record-system API')
    .setDescription(description)
    .setVersion('1.0')
    .addTag('national-health-record-system')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token (from /api/auth/login response)',
        in: 'header',
      },
      'JWT-auth', // This name matches @ApiBearerAuth() in controllers
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const swaggerPath = process.env.SWAGGER_PATH || 'api/docs';

  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep auth across page refreshes
      docExpansion: 'none', // Collapse all endpoints by default
      filter: true, // Enable search filter
      showExtensions: true, // Show vendor extensions
      tagsSorter: 'alpha', // Sort tags alphabetically
      operationsSorter: 'alpha', // Sort operations alphabetically
    },
  });

  const fullUrl = `http://localhost:${process.env.PORT || 3000}/${swaggerPath}`;
  console.log(`📚 Swagger documentation available at /${swaggerPath}`);
  console.log(`   Full URL: ${fullUrl}`);

  if (!isDevelopment) {
    console.log('   ⚠️  Running in PRODUCTION mode - ensure proper security!');
  }
}
