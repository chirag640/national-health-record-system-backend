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

  async create(data: Partial<HealthDocumentDocument>): Promise<HealthDocumentDocument> {
    const created = new this.healthDocumentModel(data);
    return await created.save();
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<HealthDocumentDocument[]> {
    return this.healthDocumentModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<HealthDocumentDocument | null> {
    return this.healthDocumentModel.findById(id).exec();
  }

  async update(
    id: string,
    data: Partial<HealthDocumentDocument>,
  ): Promise<HealthDocumentDocument | null> {
    return this.healthDocumentModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.healthDocumentModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async count(): Promise<number> {
    return this.healthDocumentModel.countDocuments().exec();
  }

  /**
   * Relationship Management Methods
   */
}
