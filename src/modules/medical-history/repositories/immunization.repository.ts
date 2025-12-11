import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, FilterQuery, Connection } from 'mongoose';
import { Immunization, ImmunizationDocument } from '../schemas/immunization.schema';
import { ImmunizationFilterDto } from '../dto/immunization.dto';
import { BaseRepository } from '../../../common/base.repository';

@Injectable()
export class ImmunizationRepository extends BaseRepository<ImmunizationDocument> {
  constructor(
    @InjectModel(Immunization.name)
    private immunizationModel: Model<ImmunizationDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(immunizationModel, connection);
  }

  async create(createDto: any): Promise<ImmunizationDocument> {
    const immunization = new this.immunizationModel(createDto);
    return immunization.save();
  }

  async findById(id: string): Promise<ImmunizationDocument | null> {
    return this.immunizationModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async update(id: string, updateDto: any): Promise<ImmunizationDocument | null> {
    return this.immunizationModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, { $set: updateDto }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.immunizationModel
      .updateOne({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } })
      .exec();
    return result.modifiedCount > 0;
  }

  async findByPatient(
    patientId: string,
    filterDto?: ImmunizationFilterDto,
  ): Promise<{ data: ImmunizationDocument[]; total: number }> {
    const query: FilterQuery<ImmunizationDocument> = {
      patientId,
      deletedAt: null,
    };

    if (filterDto?.status) {
      query.status = filterDto.status;
    }

    if (filterDto?.vaccineName) {
      query.vaccineName = { $regex: filterDto.vaccineName, $options: 'i' };
    }

    if (filterDto?.isSeriesComplete !== undefined) {
      query.isSeriesComplete = filterDto.isSeriesComplete;
    }

    if (filterDto?.isDue) {
      const today = new Date();
      query.nextDueDate = { $lte: today };
      query.isSeriesComplete = false;
    }

    if (filterDto?.search) {
      query.$or = [
        { vaccineName: { $regex: filterDto.search, $options: 'i' } },
        { targetDisease: { $regex: filterDto.search, $options: 'i' } },
        { notes: { $regex: filterDto.search, $options: 'i' } },
      ];
    }

    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.immunizationModel
        .find(query)
        .sort({ 'doses.administeredDate': -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.immunizationModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async findDue(hospitalId?: string): Promise<ImmunizationDocument[]> {
    const today = new Date();
    const query: FilterQuery<ImmunizationDocument> = {
      nextDueDate: { $lte: today },
      isSeriesComplete: false,
      status: { $in: ['scheduled', 'in-progress'] },
      deletedAt: null,
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.immunizationModel.find(query).sort({ nextDueDate: 1 }).exec();
  }

  async findIncomplete(patientId: string): Promise<ImmunizationDocument[]> {
    return this.immunizationModel
      .find({
        patientId,
        isSeriesComplete: false,
        status: { $in: ['scheduled', 'in-progress'] },
        deletedAt: null,
      })
      .sort({ nextDueDate: 1 })
      .exec();
  }

  async findByVaccineName(
    vaccineName: string,
    hospitalId?: string,
  ): Promise<ImmunizationDocument[]> {
    const query: FilterQuery<ImmunizationDocument> = {
      vaccineName: { $regex: vaccineName, $options: 'i' },
      deletedAt: null,
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.immunizationModel.find(query).sort({ 'doses.administeredDate': -1 }).exec();
  }

  async findWithAdverseReactions(patientId?: string): Promise<ImmunizationDocument[]> {
    const query: FilterQuery<ImmunizationDocument> = {
      'doses.adverseReactions': { $exists: true, $ne: [] },
      deletedAt: null,
    };

    if (patientId) {
      query.patientId = patientId;
    }

    return this.immunizationModel.find(query).sort({ 'doses.administeredDate': -1 }).exec();
  }

  async countByPatient(patientId: string): Promise<number> {
    return this.immunizationModel.countDocuments({ patientId, deletedAt: null }).exec();
  }

  async searchImmunizations(
    searchTerm: string,
    hospitalId?: string,
  ): Promise<ImmunizationDocument[]> {
    const query: FilterQuery<ImmunizationDocument> = {
      deletedAt: null,
      $or: [
        { vaccineName: { $regex: searchTerm, $options: 'i' } },
        { vaccineCode: { $regex: searchTerm, $options: 'i' } },
        { targetDisease: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.immunizationModel.find(query).sort({ 'doses.administeredDate': -1 }).exec();
  }

  async findOverdueImmunizations(patientId: string): Promise<ImmunizationDocument[]> {
    const today = new Date();
    return this.immunizationModel
      .find({
        patientId,
        nextDueDate: { $lt: today },
        isSeriesComplete: false,
        status: { $in: ['scheduled', 'in-progress'] },
        deletedAt: null,
      })
      .sort({ nextDueDate: 1 })
      .exec();
  }

  async findCompletedSeries(patientId: string): Promise<ImmunizationDocument[]> {
    return this.immunizationModel
      .find({
        patientId,
        isSeriesComplete: true,
        deletedAt: null,
      })
      .sort({ 'doses.administeredDate': -1 })
      .exec();
  }
}
