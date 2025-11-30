import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
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

  async create(data: Partial<Doctor>): Promise<Doctor> {
    const created = new this.doctorModel(data);
    const saved = await created.save();
    return saved.toObject() as Doctor;
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<Doctor[]> {
    return this.doctorModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Most recent first
      .lean()
      .exec() as Promise<Doctor[]>;
  }

  async findById(id: string): Promise<Doctor | null> {
    return this.doctorModel.findById(id).lean().exec() as Promise<Doctor | null>;
  }

  async update(id: string, data: Partial<Doctor>): Promise<Doctor | null> {
    return this.doctorModel
      .findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec() as Promise<Doctor | null>;
  }

  async delete(id: string): Promise<Doctor | null> {
    return this.doctorModel.findByIdAndDelete(id).lean().exec() as Promise<Doctor | null>;
  }

  async count(): Promise<number> {
    return this.doctorModel.countDocuments().exec();
  }

  /**
   * Advanced search with custom query
   */
  async search(query: any, skip: number = 0, limit: number = 10): Promise<Doctor[]> {
    return this.doctorModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec() as Promise<Doctor[]>;
  }

  /**
   * Count documents matching query
   */
  async countByQuery(query: any): Promise<number> {
    return this.doctorModel.countDocuments(query).exec();
  }

  /**
   * Relationship Management Methods
   */
}
