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

  async create(data: Partial<Consent>): Promise<Consent> {
    const created = new this.consentModel(data);
    const saved = await created.save();
    return saved.toObject() as Consent;
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<Consent[]> {
    return this.consentModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Most recent first
      .lean()
      .exec() as Promise<Consent[]>;
  }

  async findById(id: string): Promise<Consent | null> {
    return this.consentModel.findById(id).lean().exec() as Promise<Consent | null>;
  }

  async update(id: string, data: Partial<Consent>): Promise<Consent | null> {
    return this.consentModel
      .findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec() as Promise<Consent | null>;
  }

  async delete(id: string): Promise<Consent | null> {
    return this.consentModel.findByIdAndDelete(id).lean().exec() as Promise<Consent | null>;
  }

  async count(): Promise<number> {
    return this.consentModel.countDocuments().exec();
  }

  /**
   * Relationship Management Methods
   */
}
