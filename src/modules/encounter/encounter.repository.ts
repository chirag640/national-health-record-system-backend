import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Encounter, EncounterDocument } from './schemas/encounter.schema';
import { BaseRepository } from '../../common/base.repository';

@Injectable()
export class EncounterRepository extends BaseRepository<EncounterDocument> {
  constructor(
    @InjectModel(Encounter.name)
    private readonly encounterModel: Model<EncounterDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(encounterModel, connection);
  }

  async create(data: Partial<EncounterDocument>): Promise<EncounterDocument> {
    const created = new this.encounterModel(data);
    return await created.save();
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<EncounterDocument[]> {
    return this.encounterModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<EncounterDocument | null> {
    return this.encounterModel.findById(id).exec();
  }

  async update(id: string, data: Partial<EncounterDocument>): Promise<EncounterDocument | null> {
    return this.encounterModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.encounterModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async count(): Promise<number> {
    return this.encounterModel.countDocuments().exec();
  }

  /**
   * Advanced search with custom query
   */
  async search(query: any, skip: number = 0, limit: number = 10): Promise<EncounterDocument[]> {
    return this.encounterModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec();
  }

  /**
   * Count documents matching query
   */
  async countByQuery(query: any): Promise<number> {
    return this.encounterModel.countDocuments(query).exec();
  }

  /**
   * Relationship Management Methods
   */
}
