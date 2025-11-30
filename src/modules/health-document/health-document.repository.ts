import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { HealthDocument, HealthDocumentDocument } from './schemas/health-document.schema';
import { BaseRepository } from '../../common/base.repository';

@Injectable()
export class HealthDocumentRepository extends BaseRepository<HealthDocumentDocument> {
  constructor(
    @InjectModel(HealthDocument.name)
    private readonly healthDocumentModel: Model<HealthDocumentDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(healthDocumentModel, connection);
  }

  async create(data: Partial<HealthDocument>): Promise<HealthDocument> {
    const created = new this.healthDocumentModel(data);
    const saved = await created.save();
    return saved.toObject() as HealthDocument;
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<HealthDocument[]> {
    return this.healthDocumentModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Most recent first
      .lean()
      .exec() as Promise<HealthDocument[]>;
  }

  async findById(id: string): Promise<HealthDocument | null> {
    return this.healthDocumentModel.findById(id).lean().exec() as Promise<HealthDocument | null>;
  }

  async update(id: string, data: Partial<HealthDocument>): Promise<HealthDocument | null> {
    return this.healthDocumentModel
      .findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec() as Promise<HealthDocument | null>;
  }

  async delete(id: string): Promise<HealthDocument | null> {
    return this.healthDocumentModel
      .findByIdAndDelete(id)
      .lean()
      .exec() as Promise<HealthDocument | null>;
  }

  async count(): Promise<number> {
    return this.healthDocumentModel.countDocuments().exec();
  }

  /**
   * Relationship Management Methods
   */
}
