import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SyncQueue } from './schemas/sync-queue.schema';
import { CreateSyncQueueDto } from './dto/create-sync-queue.dto';
import { PatientService } from '../patient/patient.service';
import { DoctorService } from '../doctor/doctor.service';
import { EncounterService } from '../encounter/encounter.service';
import { ConsentService } from '../consent/consent.service';

@Injectable()
export class SyncService {
  constructor(
    @InjectModel(SyncQueue.name) private syncQueueModel: Model<SyncQueue>,
    private patientService: PatientService,
    private doctorService: DoctorService,
    private encounterService: EncounterService,
    private consentService: ConsentService,
  ) {}

  /**
   * Add operation to sync queue (called from offline clients)
   */
  async queueOperation(dto: CreateSyncQueueDto): Promise<any> {
    const syncItem = await this.syncQueueModel.create({
      ...dto,
      status: 'PENDING',
      retryCount: 0,
      version: dto.version || 1,
    });

    return {
      id: syncItem._id.toString(),
      status: syncItem.status,
      message: 'Operation queued for sync',
    };
  }

  /**
   * Get pending sync operations for a device
   */
  async getPendingSync(deviceId: string, userId: string): Promise<any[]> {
    const pending = await this.syncQueueModel
      .find({
        deviceId,
        userId,
        status: { $in: ['PENDING', 'FAILED'] },
      })
      .sort({ createdAtClient: 1 })
      .limit(100)
      .exec();

    return pending.map((item) => ({
      id: item._id.toString(),
      operation: item.operation,
      resourceType: item.resourceType,
      resourceId: item.resourceId,
      data: item.data,
      status: item.status,
      retryCount: item.retryCount,
      createdAtClient: item.createdAtClient,
      errorMessage: item.errorMessage,
    }));
  }

  /**
   * Process sync queue and apply operations to server
   */
  async processSyncQueue(syncId: string): Promise<any> {
    const syncItem = await this.syncQueueModel.findById(syncId);

    if (!syncItem) {
      throw new NotFoundException('Sync item not found');
    }

    if (syncItem.status === 'SYNCED') {
      return {
        status: 'SYNCED',
        message: 'Operation already synced',
      };
    }

    try {
      let result;

      // Apply operation based on resource type
      switch (syncItem.resourceType) {
        case 'patient':
          result = await this.syncPatient(syncItem);
          break;
        case 'doctor':
          result = await this.syncDoctor(syncItem);
          break;
        case 'encounter':
          result = await this.syncEncounter(syncItem);
          break;
        case 'consent':
          result = await this.syncConsent(syncItem);
          break;
        default:
          throw new BadRequestException(`Unsupported resource type: ${syncItem.resourceType}`);
      }

      // Mark as synced
      await this.syncQueueModel.findByIdAndUpdate(syncId, {
        status: 'SYNCED',
        syncedAt: new Date(),
        errorMessage: null,
      });

      return {
        status: 'SYNCED',
        message: 'Operation synced successfully',
        result,
      };
    } catch (error: any) {
      // Check for conflicts
      if (error instanceof ConflictException || error.message.includes('version')) {
        await this.syncQueueModel.findByIdAndUpdate(syncId, {
          status: 'CONFLICT',
          errorMessage: error.message,
          retryCount: syncItem.retryCount + 1,
        });

        return {
          status: 'CONFLICT',
          message: 'Version conflict detected',
          error: error.message,
          resolutionOptions: ['CLIENT_WINS', 'SERVER_WINS', 'MANUAL'],
        };
      }

      // Mark as failed and increment retry count
      await this.syncQueueModel.findByIdAndUpdate(syncId, {
        status: 'FAILED',
        errorMessage: error.message,
        retryCount: syncItem.retryCount + 1,
      });

      throw error;
    }
  }

  /**
   * Sync patient operations
   */
  private async syncPatient(syncItem: SyncQueue): Promise<any> {
    switch (syncItem.operation) {
      case 'CREATE':
        return await this.patientService.create(syncItem.data as any);
      case 'UPDATE':
        if (!syncItem.resourceId) {
          throw new BadRequestException('Resource ID required for UPDATE');
        }
        return await this.patientService.update(syncItem.resourceId, syncItem.data as any);
      case 'DELETE':
        if (!syncItem.resourceId) {
          throw new BadRequestException('Resource ID required for DELETE');
        }
        return await this.patientService.remove(syncItem.resourceId);
      default:
        throw new BadRequestException(`Unsupported operation: ${syncItem.operation}`);
    }
  }

  /**
   * Sync doctor operations
   */
  private async syncDoctor(syncItem: SyncQueue): Promise<any> {
    switch (syncItem.operation) {
      case 'CREATE':
        return await this.doctorService.create(syncItem.data as any);
      case 'UPDATE':
        if (!syncItem.resourceId) {
          throw new BadRequestException('Resource ID required for UPDATE');
        }
        return await this.doctorService.update(syncItem.resourceId, syncItem.data as any);
      case 'DELETE':
        if (!syncItem.resourceId) {
          throw new BadRequestException('Resource ID required for DELETE');
        }
        return await this.doctorService.remove(syncItem.resourceId);
      default:
        throw new BadRequestException(`Unsupported operation: ${syncItem.operation}`);
    }
  }

  /**
   * Sync encounter operations
   */
  private async syncEncounter(syncItem: SyncQueue): Promise<any> {
    switch (syncItem.operation) {
      case 'CREATE':
        return await this.encounterService.create(syncItem.data as any);
      case 'UPDATE':
        if (!syncItem.resourceId) {
          throw new BadRequestException('Resource ID required for UPDATE');
        }
        // Note: Encounter update has 24-hour restriction
        return await this.encounterService.update(syncItem.resourceId, syncItem.data as any);
      case 'DELETE':
        if (!syncItem.resourceId) {
          throw new BadRequestException('Resource ID required for DELETE');
        }
        return await this.encounterService.remove(syncItem.resourceId);
      default:
        throw new BadRequestException(`Unsupported operation: ${syncItem.operation}`);
    }
  }

  /**
   * Sync consent operations
   */
  private async syncConsent(syncItem: SyncQueue): Promise<any> {
    switch (syncItem.operation) {
      case 'CREATE':
        return await this.consentService.create(syncItem.data as any);
      case 'UPDATE':
        if (!syncItem.resourceId) {
          throw new BadRequestException('Resource ID required for UPDATE');
        }
        return await this.consentService.update(syncItem.resourceId, syncItem.data as any);
      case 'DELETE':
        if (!syncItem.resourceId) {
          throw new BadRequestException('Resource ID required for DELETE');
        }
        return await this.consentService.remove(syncItem.resourceId);
      default:
        throw new BadRequestException(`Unsupported operation: ${syncItem.operation}`);
    }
  }

  /**
   * Resolve sync conflict
   */
  async resolveConflict(
    syncId: string,
    resolution: 'CLIENT_WINS' | 'SERVER_WINS' | 'MANUAL',
  ): Promise<any> {
    const syncItem = await this.syncQueueModel.findById(syncId);

    if (!syncItem) {
      throw new NotFoundException('Sync item not found');
    }

    if (syncItem.status !== 'CONFLICT') {
      throw new BadRequestException('No conflict to resolve');
    }

    syncItem.conflictResolution = resolution;

    if (resolution === 'CLIENT_WINS') {
      // Force apply client data (overwrite server)
      try {
        await this.processSyncQueue(syncId);
        return { status: 'RESOLVED', strategy: 'CLIENT_WINS' };
      } catch (error: any) {
        throw new BadRequestException(`Failed to apply client data: ${error.message}`);
      }
    } else if (resolution === 'SERVER_WINS') {
      // Discard client data
      await this.syncQueueModel.findByIdAndUpdate(syncId, {
        status: 'SYNCED',
        syncedAt: new Date(),
        conflictResolution: 'SERVER_WINS',
      });
      return { status: 'RESOLVED', strategy: 'SERVER_WINS' };
    } else {
      // Manual resolution required - mark for review
      await this.syncQueueModel.findByIdAndUpdate(syncId, {
        conflictResolution: 'MANUAL',
      });
      return { status: 'PENDING_MANUAL_REVIEW', strategy: 'MANUAL' };
    }
  }

  /**
   * Get sync statistics for monitoring
   */
  async getSyncStats(userId?: string): Promise<any> {
    const filter: any = {};
    if (userId) {
      filter.userId = userId;
    }

    const [total, pending, synced, failed, conflicts] = await Promise.all([
      this.syncQueueModel.countDocuments(filter),
      this.syncQueueModel.countDocuments({ ...filter, status: 'PENDING' }),
      this.syncQueueModel.countDocuments({ ...filter, status: 'SYNCED' }),
      this.syncQueueModel.countDocuments({ ...filter, status: 'FAILED' }),
      this.syncQueueModel.countDocuments({ ...filter, status: 'CONFLICT' }),
    ]);

    return {
      total,
      pending,
      synced,
      failed,
      conflicts,
      syncRate: total > 0 ? ((synced / total) * 100).toFixed(2) + '%' : '0%',
    };
  }

  /**
   * Retry failed sync operations
   */
  async retryFailed(deviceId: string, userId: string): Promise<any> {
    const failed = await this.syncQueueModel.find({
      deviceId,
      userId,
      status: 'FAILED',
      retryCount: { $lt: 3 }, // Max 3 retries
    });

    const results = [];
    for (const item of failed) {
      try {
        const result = await this.processSyncQueue(item._id.toString());
        results.push({ id: item._id.toString(), status: 'SUCCESS', result });
      } catch (error: any) {
        results.push({ id: item._id.toString(), status: 'FAILED', error: error.message });
      }
    }

    return {
      total: failed.length,
      results,
    };
  }

  /**
   * Clear synced items older than specified days
   */
  async clearOldSyncedItems(days: number = 30): Promise<any> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.syncQueueModel.deleteMany({
      status: 'SYNCED',
      syncedAt: { $lt: cutoffDate },
    });

    return {
      deleted: result.deletedCount,
      message: `Cleared ${result.deletedCount} synced items older than ${days} days`,
    };
  }
}
