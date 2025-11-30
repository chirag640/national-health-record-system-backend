import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './modules/logger/logger.module';
import { CacheModule } from './modules/cache/cache.module';
import { HealthModule } from './modules/health/health.module';
import { ThrottlerModule } from './modules/throttler/throttler.module';
import { QueueModule } from './modules/queue/queue.module';
import { S3LifecycleModule } from './modules/s3-lifecycle/s3-lifecycle.module';
import { EncryptionModule } from './common/encryption.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
// Generated model modules
import { PatientModule } from './modules/patient/patient.module';
import { HospitalModule } from './modules/hospital/hospital.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { EncounterModule } from './modules/encounter/encounter.module';
import { HealthDocumentModule } from './modules/health-document/health-document.module';
import { ConsentModule } from './modules/consent/consent.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DATABASE_URL!, {
      // Production-ready connection pool configuration
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2, // Minimum number of connections to maintain
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if no server available
      heartbeatFrequencyMS: 10000, // Check server health every 10s
      retryWrites: true, // Automatically retry write operations
      retryReads: true, // Automatically retry read operations
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] }, // ?lang=hi
        AcceptLanguageResolver, // Accept-Language: hi
        new HeaderResolver(['x-custom-lang']), // x-custom-lang: hi
      ],
    }),
    LoggerModule,
    CacheModule,
    HealthModule,
    ThrottlerModule,
    QueueModule,
    S3LifecycleModule,
    EncryptionModule, // Global encryption layer (KMS + AES-GCM)
    AuthModule, // Email-based authentication with OTP
    EmailModule, // SMTP email service
    // Generated modules
    PatientModule,
    HospitalModule,
    DoctorModule,
    EncounterModule,
    HealthDocumentModule,
    ConsentModule,
    AuditLogModule,
    SyncModule, // Offline sync for rural hospitals
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
