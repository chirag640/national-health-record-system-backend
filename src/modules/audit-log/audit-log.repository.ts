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

  async create(data: Partial<AuditLogDocument>): Promise<AuditLogDocument> {
    const created = new this.auditLogModel(data);
    return await created.save();
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<AuditLogDocument[]> {
    return this.auditLogModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<AuditLogDocument | null> {
    return this.auditLogModel.findById(id).exec();
  }

  async update(id: string, data: Partial<AuditLogDocument>): Promise<AuditLogDocument | null> {
    return this.auditLogModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.auditLogModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async count(): Promise<number> {
    return this.auditLogModel.countDocuments().exec();
  }

  /**
   * Relationship Management Methods
   */
}
