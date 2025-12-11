import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: MongooseHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check endpoint',
    description:
      'Checks database, memory, and disk health. Used by load balancers and monitoring systems.',
  })
  @ApiResponse({
    status: 200,
    description: 'System healthy',
    schema: {
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Service unavailable - health check failed' })
  check() {
    return this.health.check([
      // Database health check
      () => this.db.pingCheck('database'),

      // Memory heap check (should not exceed 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

      // Memory RSS check (should not exceed 300MB)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),

      // Disk storage check (should have at least 10% free disk space)
      () =>
        this.disk.checkStorage('disk', {
          path: process.env.DISK_CHECK_PATH || (process.platform === 'win32' ? 'C:\\' : '/'),
          thresholdPercent: 0.9,
        }),
    ]);
  }
}
