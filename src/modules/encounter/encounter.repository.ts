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

  async create(data: Partial<Encounter>): Promise<Encounter> {
    const created = new this.encounterModel(data);
    const saved = await created.save();
    return saved.toObject() as Encounter;
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<Encounter[]> {
    return this.encounterModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Most recent first
      .lean()
      .exec() as Promise<Encounter[]>;
  }

  async findById(id: string): Promise<Encounter | null> {
    return this.encounterModel.findById(id).lean().exec() as Promise<Encounter | null>;
  }

  async update(id: string, data: Partial<Encounter>): Promise<Encounter | null> {
    return this.encounterModel
      .findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec() as Promise<Encounter | null>;
  }

  async delete(id: string): Promise<Encounter | null> {
    return this.encounterModel.findByIdAndDelete(id).lean().exec() as Promise<Encounter | null>;
  }

  async count(): Promise<number> {
    return this.encounterModel.countDocuments().exec();
  }

  /**
   * Relationship Management Methods
   */
}
