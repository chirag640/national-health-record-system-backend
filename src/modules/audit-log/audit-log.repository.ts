import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { BaseRepository } from '../../common/base.repository';

@Injectable()
export class AuditLogRepository extends BaseRepository<AuditLogDocument> {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(auditLogModel, connection);
  }

  async create(data: Partial<AuditLog>): Promise<AuditLog> {
    const created = new this.auditLogModel(data);
    const saved = await created.save();
    return saved.toObject() as AuditLog;
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<AuditLog[]> {
    return this.auditLogModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Most recent first
      .lean()
      .exec() as Promise<AuditLog[]>;
  }

  async findById(id: string): Promise<AuditLog | null> {
    return this.auditLogModel.findById(id).lean().exec() as Promise<AuditLog | null>;
  }

  async update(id: string, data: Partial<AuditLog>): Promise<AuditLog | null> {
    return this.auditLogModel
      .findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec() as Promise<AuditLog | null>;
  }

  async delete(id: string): Promise<AuditLog | null> {
    return this.auditLogModel.findByIdAndDelete(id).lean().exec() as Promise<AuditLog | null>;
  }

  async count(): Promise<number> {
    return this.auditLogModel.countDocuments().exec();
  }

  /**
   * Relationship Management Methods
   */
}
