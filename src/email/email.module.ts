import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST'),
          port: configService.get<number>('SMTP_PORT'),
          secure: configService.get<boolean>('SMTP_SECURE', false), // true for 465, false for 587
          // Note: requireTLS is only for ports like 587, not needed for 465
          tls: {
            // Allow self-signed certs for development
            rejectUnauthorized: configService.get<string>('NODE_ENV') === 'production',
            minVersion: 'TLSv1.2',
          },
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASSWORD'),
          },
          // Gmail-specific optimizations
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          rateDelta: 1000,
          rateLimit: 5,
          // Faster timeouts for better mobile UX
          connectionTimeout: 5000, // 5 seconds
          greetingTimeout: 5000,
          socketTimeout: 5000,
        },
        defaults: {
          from: configService.get<string>(
            'EMAIL_FROM',
            'noreply@national-health-record-system.com',
          ),
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule { }
