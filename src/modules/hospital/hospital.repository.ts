import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Hospital, HospitalDocument } from './schemas/hospital.schema';
import { BaseRepository } from '../../common/base.repository';

@Injectable()
export class HospitalRepository extends BaseRepository<HospitalDocument> {
  constructor(
    @InjectModel(Hospital.name)
    private readonly hospitalModel: Model<HospitalDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(hospitalModel, connection);
  }

  async create(data: Partial<Hospital>): Promise<Hospital> {
    const created = new this.hospitalModel(data);
    const saved = await created.save();
    return saved.toObject() as Hospital;
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<Hospital[]> {
    return this.hospitalModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Most recent first
      .lean()
      .exec() as Promise<Hospital[]>;
  }

  async findById(id: string): Promise<Hospital | null> {
    return this.hospitalModel.findById(id).lean().exec() as Promise<Hospital | null>;
  }

  async update(id: string, data: Partial<Hospital>): Promise<Hospital | null> {
    return this.hospitalModel
      .findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec() as Promise<Hospital | null>;
  }

  async delete(id: string): Promise<Hospital | null> {
    return this.hospitalModel.findByIdAndDelete(id).lean().exec() as Promise<Hospital | null>;
  }

  async count(): Promise<number> {
    return this.hospitalModel.countDocuments().exec();
  }

  /**
   * Relationship Management Methods
   */
}
