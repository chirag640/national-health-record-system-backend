import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Patient, PatientDocument } from './schemas/patient.schema';
import { BaseRepository } from '../../common/base.repository';

@Injectable()
export class PatientRepository extends BaseRepository<PatientDocument> {
  constructor(
    @InjectModel(Patient.name)
    private readonly patientModel: Model<PatientDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(patientModel, connection);
  }

  async create(data: Partial<PatientDocument>): Promise<PatientDocument> {
    const created = new this.patientModel(data);
    return await created.save();
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<PatientDocument[]> {
    return this.patientModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<PatientDocument | null> {
    return this.patientModel.findById(id).exec();
  }

  async update(id: string, data: Partial<PatientDocument>): Promise<PatientDocument | null> {
    return this.patientModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.patientModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async count(): Promise<number> {
    return this.patientModel.countDocuments().exec();
  }

  async findByGuid(guid: string): Promise<PatientDocument | null> {
    return this.patientModel.findOne({ guid }).exec();
  }

  /**
   * Advanced search with custom query
   */
  async search(query: any, skip: number = 0, limit: number = 10): Promise<PatientDocument[]> {
    return this.patientModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec();
  }

  /**
   * Count documents matching query
   */
  async countByQuery(query: any): Promise<number> {
    return this.patientModel.countDocuments(query).exec();
  }

  /**
   * Relationship Management Methods
   */
}
