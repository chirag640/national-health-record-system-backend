import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from '@nestjs/config';
import {
  HealthController,
  MongoDBHealthIndicator,
  RedisHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  ExternalServicesHealthIndicator,
} from './health.service';

@Module({
  imports: [TerminusModule, ConfigModule],
  controllers: [HealthController],
  providers: [
    MongoDBHealthIndicator,
    RedisHealthIndicator,
    MemoryHealthIndicator,
    DiskHealthIndicator,
    ExternalServicesHealthIndicator,
  ],
  exports: [
    MongoDBHealthIndicator,
    RedisHealthIndicator,
    MemoryHealthIndicator,
    DiskHealthIndicator,
    ExternalServicesHealthIndicator,
  ],
})
export class HealthModule {}
