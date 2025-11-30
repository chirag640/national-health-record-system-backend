import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Delete,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { CreateSyncQueueDto } from './dto/create-sync-queue.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/schemas/user.schema';

@ApiTags('Offline Sync')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'sync', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('queue')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Queue operation for offline sync',
    description:
      'Client adds operations to sync queue when offline. Operations will be processed when connection is restored.',
  })
  @ApiResponse({
    status: 201,
    description: 'Operation queued successfully',
    schema: {
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439030' },
        status: { type: 'string', example: 'PENDING' },
        message: { type: 'string', example: 'Operation queued for sync' },
      },
    },
  })
  async queueOperation(@Body() dto: CreateSyncQueueDto) {
    return this.syncService.queueOperation(dto);
  }

  @Get('pending')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Get pending sync operations',
    description: 'Retrieve all pending and failed sync operations for a device.',
  })
  @ApiQuery({ name: 'deviceId', required: true, example: 'device-123-abc-456' })
  @ApiQuery({ name: 'userId', required: true, example: '507f1f77bcf86cd799439011' })
  async getPendingSync(@Query('deviceId') deviceId: string, @Query('userId') userId: string) {
    return this.syncService.getPendingSync(deviceId, userId);
  }

  @Post('process/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Process sync queue item',
    description: 'Apply queued operation to server. Handles conflicts with version checking.',
  })
  @ApiResponse({
    status: 200,
    description: 'Operation processed successfully',
    schema: {
      oneOf: [
        {
          properties: {
            status: { type: 'string', example: 'SYNCED' },
            message: { type: 'string', example: 'Operation synced successfully' },
            result: { type: 'object' },
          },
        },
        {
          properties: {
            status: { type: 'string', example: 'CONFLICT' },
            message: { type: 'string', example: 'Version conflict detected' },
            error: { type: 'string' },
            resolutionOptions: { type: 'array', items: { type: 'string' } },
          },
        },
      ],
    },
  })
  async processSyncQueue(@Param('id') id: string) {
    return this.syncService.processSyncQueue(id);
  }

  @Patch('resolve/:id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Resolve sync conflict',
    description:
      'Manually resolve version conflicts. Strategies: CLIENT_WINS (use offline data), ' +
      'SERVER_WINS (discard offline data), MANUAL (review required).',
  })
  @ApiQuery({
    name: 'resolution',
    required: true,
    enum: ['CLIENT_WINS', 'SERVER_WINS', 'MANUAL'],
  })
  async resolveConflict(
    @Param('id') id: string,
    @Query('resolution') resolution: 'CLIENT_WINS' | 'SERVER_WINS' | 'MANUAL',
  ) {
    return this.syncService.resolveConflict(id, resolution);
  }

  @Post('retry')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Retry failed sync operations',
    description: 'Retry all failed sync operations for a device (max 3 attempts).',
  })
  @ApiQuery({ name: 'deviceId', required: true })
  @ApiQuery({ name: 'userId', required: true })
  async retryFailed(@Query('deviceId') deviceId: string, @Query('userId') userId: string) {
    return this.syncService.retryFailed(deviceId, userId);
  }

  @Get('stats')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get sync statistics',
    description: 'View sync queue statistics for monitoring. Filter by user ID if provided.',
  })
  @ApiQuery({ name: 'userId', required: false })
  async getSyncStats(@Query('userId') userId?: string) {
    return this.syncService.getSyncStats(userId);
  }

  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Clean up old synced items',
    description: 'Delete synced items older than specified days (default: 30 days).',
  })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  async clearOldSyncedItems(@Query('days') days?: number) {
    return this.syncService.clearOldSyncedItems(days ? parseInt(days.toString()) : 30);
  }
}
