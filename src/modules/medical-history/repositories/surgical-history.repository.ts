import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, FilterQuery, Connection } from 'mongoose';
import { SurgicalHistory, SurgicalHistoryDocument } from '../schemas/surgical-history.schema';
import { SurgicalHistoryFilterDto } from '../dto/surgical-history.dto';
import { BaseRepository } from '../../../common/base.repository';

@Injectable()
export class SurgicalHistoryRepository extends BaseRepository<SurgicalHistoryDocument> {
  constructor(
    @InjectModel(SurgicalHistory.name)
    private surgicalHistoryModel: Model<SurgicalHistoryDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(surgicalHistoryModel, connection);
  }

  async create(createDto: any): Promise<SurgicalHistoryDocument> {
    const surgery = new this.surgicalHistoryModel(createDto);
    return surgery.save();
  }

  async findById(id: string): Promise<SurgicalHistoryDocument | null> {
    return this.surgicalHistoryModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async update(id: string, updateDto: any): Promise<SurgicalHistoryDocument | null> {
    return this.surgicalHistoryModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, { $set: updateDto }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.surgicalHistoryModel
      .updateOne({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } })
      .exec();
    return result.modifiedCount > 0;
  }

  async findByPatient(
    patientId: string,
    filterDto?: SurgicalHistoryFilterDto,
  ): Promise<{ data: SurgicalHistoryDocument[]; total: number }> {
    const query: FilterQuery<SurgicalHistoryDocument> = {
      patientId,
      deletedAt: null,
    };

    if (filterDto?.surgeryType) {
      query.surgeryType = filterDto.surgeryType;
    }

    if (filterDto?.outcome) {
      query.outcome = filterDto.outcome;
    }

    if (filterDto?.search) {
      query.$or = [
        { surgeryName: { $regex: filterDto.search, $options: 'i' } },
        { indication: { $regex: filterDto.search, $options: 'i' } },
        { procedure: { $regex: filterDto.search, $options: 'i' } },
      ];
    }

    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.surgicalHistoryModel
        .find(query)
        .sort({ surgeryDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.surgicalHistoryModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async findByType(surgeryType: string, hospitalId?: string): Promise<SurgicalHistoryDocument[]> {
    const query: FilterQuery<SurgicalHistoryDocument> = {
      surgeryType,
      deletedAt: null,
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.surgicalHistoryModel.find(query).sort({ surgeryDate: -1 }).exec();
  }

  async findByOutcome(outcome: string, hospitalId?: string): Promise<SurgicalHistoryDocument[]> {
    const query: FilterQuery<SurgicalHistoryDocument> = {
      outcome,
      deletedAt: null,
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.surgicalHistoryModel.find(query).sort({ surgeryDate: -1 }).exec();
  }

  async findWithComplications(patientId?: string): Promise<SurgicalHistoryDocument[]> {
    const query: FilterQuery<SurgicalHistoryDocument> = {
      complications: { $exists: true, $ne: [] },
      deletedAt: null,
    };

    if (patientId) {
      query.patientId = patientId;
    }

    return this.surgicalHistoryModel.find(query).sort({ surgeryDate: -1 }).exec();
  }

  async findRequiringFollowUp(hospitalId?: string): Promise<SurgicalHistoryDocument[]> {
    const today = new Date();
    const query: FilterQuery<SurgicalHistoryDocument> = {
      followUpRequired: true,
      followUpDate: { $gte: today },
      deletedAt: null,
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.surgicalHistoryModel.find(query).sort({ followUpDate: 1 }).exec();
  }

  async countByPatient(patientId: string): Promise<number> {
    return this.surgicalHistoryModel.countDocuments({ patientId, deletedAt: null }).exec();
  }

  async searchSurgeries(
    searchTerm: string,
    hospitalId?: string,
  ): Promise<SurgicalHistoryDocument[]> {
    const query: FilterQuery<SurgicalHistoryDocument> = {
      deletedAt: null,
      $or: [
        { surgeryName: { $regex: searchTerm, $options: 'i' } },
        { cptCode: { $regex: searchTerm, $options: 'i' } },
        { icd10Code: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.surgicalHistoryModel.find(query).sort({ surgeryDate: -1 }).exec();
  }
}
