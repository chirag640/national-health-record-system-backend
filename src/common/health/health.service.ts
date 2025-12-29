import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckService,
  HealthCheck,
  HealthCheckResult,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import * as os from 'os';

/**
 * MongoDB Health Indicator
 */
@Injectable()
export class MongoDBHealthIndicator extends HealthIndicator {
  constructor(@InjectConnection() private readonly connection: Connection) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isConnected = this.connection.readyState === 1;

    if (isConnected) {
      try {
        // Perform a quick ping
        const db = this.connection.db;
        if (!db) {
          return this.getStatus(key, false, {
            status: 'error',
            message: 'Database not initialized',
          });
        }
        await db.admin().ping();

        return this.getStatus(key, true, {
          status: 'connected',
          host: this.connection.host,
          name: this.connection.name,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return this.getStatus(key, false, {
          status: 'error',
          message: errorMessage,
        });
      }
    }

    return this.getStatus(key, false, {
      status: 'disconnected',
      readyState: this.connection.readyState,
    });
  }
}

/**
 * Redis Health Indicator
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const Redis = require('ioredis');
      const redis = new Redis(this.configService.get('REDIS_URL'), {
        lazyConnect: true,
        connectTimeout: 5000,
        maxRetriesPerRequest: 1,
      });

      await redis.connect();
      const pong = await redis.ping();
      const info = await redis.info('memory');
      await redis.quit();

      // Parse memory info
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memoryUsed = memoryMatch ? memoryMatch[1] : 'unknown';

      return this.getStatus(key, pong === 'PONG', {
        status: 'connected',
        memoryUsed,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.getStatus(key, false, {
        status: 'disconnected',
        message: errorMessage,
      });
    }
  }
}

/**
 * Memory Health Indicator
 */
@Injectable()
export class MemoryHealthIndicator extends HealthIndicator {
  private readonly heapThreshold = 0.85; // 85% heap usage threshold

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const memoryUsage = process.memoryUsage();
    const heapUsedPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
    const isHealthy = heapUsedPercent < this.heapThreshold;

    return this.getStatus(key, isHealthy, {
      heapUsed: this.formatBytes(memoryUsage.heapUsed),
      heapTotal: this.formatBytes(memoryUsage.heapTotal),
      heapUsedPercent: `${(heapUsedPercent * 100).toFixed(2)}%`,
      external: this.formatBytes(memoryUsage.external),
      rss: this.formatBytes(memoryUsage.rss),
      systemFreeMemory: this.formatBytes(os.freemem()),
      systemTotalMemory: this.formatBytes(os.totalmem()),
    });
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let value = bytes;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }
}

/**
 * Disk Health Indicator
 */
@Injectable()
export class DiskHealthIndicator extends HealthIndicator {
  private readonly diskThreshold = 0.9; // 90% disk usage threshold

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const { execSync } = require('child_process');

      // Works on Linux/Mac
      const dfOutput = execSync('df -P / | tail -1').toString();
      const parts = dfOutput.split(/\s+/);
      const usedPercent = parseInt(parts[4].replace('%', ''), 10) / 100;

      const isHealthy = usedPercent < this.diskThreshold;

      return this.getStatus(key, isHealthy, {
        usedPercent: `${(usedPercent * 100).toFixed(2)}%`,
        available: parts[3],
        total: parts[1],
      });
    } catch {
      // Windows or command not available
      return this.getStatus(key, true, {
        message: 'Disk check not available on this platform',
      });
    }
  }
}

/**
 * External Services Health Indicator
 */
@Injectable()
export class ExternalServicesHealthIndicator extends HealthIndicator {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const services: Record<string, boolean> = {};

    // Check if email service is configured
    services.email = !!this.configService.get('MAIL_USER');

    // Check if Firebase is configured
    services.firebase = !!this.configService.get('FIREBASE_PROJECT_ID');

    // Check if Twilio is configured
    services.twilio = !!this.configService.get('TWILIO_ACCOUNT_SID');

    // Check if AWS S3 is configured
    services.s3 = !!this.configService.get('AWS_BUCKET_NAME');

    // Check if Razorpay is configured
    services.razorpay = !!this.configService.get('RAZORPAY_KEY_ID');

    const allConfigured = Object.values(services).every(Boolean);

    return this.getStatus(key, allConfigured, {
      services,
    });
  }
}

/**
 * Comprehensive Health Check Controller
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
@Injectable()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoHealth: MongoDBHealthIndicator,
    private redisHealth: RedisHealthIndicator,
    private memoryHealth: MemoryHealthIndicator,
    private diskHealth: DiskHealthIndicator,
    private externalHealth: ExternalServicesHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([() => this.mongoHealth.isHealthy('mongodb')]);
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check for monitoring' })
  @ApiResponse({ status: 200, description: 'Detailed health status' })
  @HealthCheck()
  async checkDetailed(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.mongoHealth.isHealthy('mongodb'),
      () => this.redisHealth.isHealthy('redis'),
      () => this.memoryHealth.isHealthy('memory'),
      () => this.diskHealth.isHealthy('disk'),
      () => this.externalHealth.isHealthy('externalServices'),
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready to accept traffic' })
  @HealthCheck()
  async readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.mongoHealth.isHealthy('mongodb'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  @Get('live')
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async liveness(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Application metrics for monitoring' })
  @ApiResponse({ status: 200, description: 'Application metrics' })
  async metrics(): Promise<any> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    return {
      process: {
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        uptimeSeconds: uptime,
        pid: process.pid,
        nodeVersion: process.version,
      },
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      system: {
        loadAverage: os.loadavg(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
        cpuCount: os.cpus().length,
        platform: os.platform(),
      },
      environment: this.configService.get('NODE_ENV'),
      version: this.configService.get('APP_VERSION', '1.0.0'),
      timestamp: new Date().toISOString(),
    };
  }
}
