import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Consent, ConsentDocument } from './schemas/consent.schema';
import { BaseRepository } from '../../common/base.repository';

@Injectable()
export class ConsentRepository extends BaseRepository<ConsentDocument> {
  constructor(
    @InjectModel(Consent.name)
    private readonly consentModel: Model<ConsentDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(consentModel, connection);
  }

  async create(data: Partial<ConsentDocument>): Promise<ConsentDocument> {
    const created = new this.consentModel(data);
    return await created.save();
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<ConsentDocument[]> {
    return this.consentModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<ConsentDocument | null> {
    return this.consentModel.findById(id).exec();
  }

  async update(id: string, data: Partial<ConsentDocument>): Promise<ConsentDocument | null> {
    return this.consentModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.consentModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async count(): Promise<number> {
    return this.consentModel.countDocuments().exec();
  }

  /**
   * Relationship Management Methods
   */
}
