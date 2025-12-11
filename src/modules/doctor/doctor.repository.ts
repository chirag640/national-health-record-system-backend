import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, FilterQuery } from 'mongoose';
import { Doctor, DoctorDocument } from './schemas/doctor.schema';
import { BaseRepository } from '../../common/base.repository';

@Injectable()
export class DoctorRepository extends BaseRepository<DoctorDocument> {
  constructor(
    @InjectModel(Doctor.name)
    private readonly doctorModel: Model<DoctorDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(doctorModel, connection);
  }

  async create(data: Partial<DoctorDocument>): Promise<DoctorDocument> {
    const created = new this.doctorModel(data);
    return await created.save();
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<DoctorDocument[]> {
    return this.doctorModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<DoctorDocument | null> {
    return this.doctorModel.findById(id).exec();
  }

  async update(id: string, data: Partial<DoctorDocument>): Promise<DoctorDocument | null> {
    return this.doctorModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.doctorModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async count(): Promise<number> {
    return this.doctorModel.countDocuments().exec();
  }

  /**
   * Advanced search with custom query
   */
  async search(
    query: FilterQuery<DoctorDocument>,
    skip: number = 0,
    limit: number = 10,
  ): Promise<DoctorDocument[]> {
    return this.doctorModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec();
  }

  /**
   * Count documents matching query
   */
  async countByQuery(query: FilterQuery<DoctorDocument>): Promise<number> {
    return this.doctorModel.countDocuments(query).exec();
  }

  /**
   * Relationship Management Methods
   */
}
