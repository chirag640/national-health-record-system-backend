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

  async create(data: Partial<HospitalDocument>): Promise<HospitalDocument> {
    const created = new this.hospitalModel(data);
    return await created.save();
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<HospitalDocument[]> {
    return this.hospitalModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<HospitalDocument | null> {
    return this.hospitalModel.findById(id).exec();
  }

  async update(id: string, data: Partial<HospitalDocument>): Promise<HospitalDocument | null> {
    return this.hospitalModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.hospitalModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async count(): Promise<number> {
    return this.hospitalModel.countDocuments().exec();
  }

  /**
   * Relationship Management Methods
   */
}
