import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),

  // MongoDB Configuration
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Redis Configuration
  // Format: redis://[username:password@]host:port[/database]
  // Example: redis://localhost:6379 or redis://user:pass@redis-host:6379/0
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // CORS Configuration
  ALLOWED_ORIGINS: z
    .string()
    .transform((val) => val.split(','))
    .default('http://localhost:3000'),

  // Rate Limiting Configuration
  THROTTLE_TTL: z
    .string()
    .optional()
    .default('60000')
    .transform((val) => parseInt(val, 10)),
  THROTTLE_LIMIT: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),

  // Request Configuration
  REQUEST_BODY_LIMIT: z.string().optional().default('1mb'),
  REQUEST_TIMEOUT: z
    .string()
    .optional()
    .default('30000')
    .transform((val) => parseInt(val, 10)),

  // Security
  CSRF_SECRET: z.string().optional(),
  SUPER_ADMIN_SECRET: z.string().optional(), // Secret key for super admin registration

  // Documentation
  ENABLE_SWAGGER: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),

  // Health Check Configuration
  DISK_CHECK_PATH: z.string().default('/'),

  // Email/SMTP Configuration (Gmail App Password)
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z
    .string()
    .optional()
    .default('587')
    .transform((val) => parseInt(val, 10)),
  SMTP_SECURE: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  SMTP_USER: z.string().email('SMTP_USER must be a valid email').min(1, 'SMTP_USER is required'),
  SMTP_PASSWORD: z.string().min(1, 'SMTP_PASSWORD (App Password) is required'),
  EMAIL_FROM: z
    .string()
    .min(1, 'EMAIL_FROM is required')
    .refine(
      (val) => {
        // Accept both formats: "email@example.com" or "Name <email@example.com>"
        const plainEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const rfc5322 = /^.+\s*<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
        return plainEmail.test(val) || rfc5322.test(val);
      },
      { message: 'EMAIL_FROM must be a valid email or format: "Name <email@example.com>"' },
    ),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // AWS S3 Configuration (optional, for document storage)
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // KMS Configuration (optional, for encryption)
  KMS_KEY_ID: z.string().optional(),
  USE_LOCAL_KMS: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(): EnvConfig {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors
        .map((err) => {
          const path = err.path.join('.');
          return `  ❌ ${path}: ${err.message}`;
        })
        .join('\n');

      console.error('\n🚨 Environment validation failed:\n');
      console.error(messages);
      console.error(
        '\n📝 Please check your .env file and ensure all required variables are set.\n',
      );
      console.error('💡 See .env.example for reference.\n');

      process.exit(1);
    }
    throw error;
  }
}
