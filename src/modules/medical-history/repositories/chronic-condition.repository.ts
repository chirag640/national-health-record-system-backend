import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, FilterQuery, Connection } from 'mongoose';
import { ChronicCondition, ChronicConditionDocument } from '../schemas/chronic-condition.schema';
import { ChronicConditionFilterDto } from '../dto/chronic-condition.dto';
import { BaseRepository } from '../../../common/base.repository';

@Injectable()
export class ChronicConditionRepository extends BaseRepository<ChronicConditionDocument> {
  constructor(
    @InjectModel(ChronicCondition.name)
    private chronicConditionModel: Model<ChronicConditionDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(chronicConditionModel, connection);
  }

  async create(createDto: any): Promise<ChronicConditionDocument> {
    const condition = new this.chronicConditionModel(createDto);
    return condition.save();
  }

  async findById(id: string): Promise<ChronicConditionDocument | null> {
    return this.chronicConditionModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async update(id: string, updateDto: any): Promise<ChronicConditionDocument | null> {
    return this.chronicConditionModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, { $set: updateDto }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.chronicConditionModel
      .updateOne({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } })
      .exec();
    return result.modifiedCount > 0;
  }

  async findByPatient(
    patientId: string,
    filterDto?: ChronicConditionFilterDto,
  ): Promise<{ data: ChronicConditionDocument[]; total: number }> {
    const query: FilterQuery<ChronicConditionDocument> = {
      patientId,
      deletedAt: null,
    };

    if (filterDto?.status) {
      query.status = filterDto.status;
    }

    if (filterDto?.severity) {
      query.severity = filterDto.severity;
    }

    if (filterDto?.search) {
      query.$or = [
        { conditionName: { $regex: filterDto.search, $options: 'i' } },
        { treatmentPlan: { $regex: filterDto.search, $options: 'i' } },
        { notes: { $regex: filterDto.search, $options: 'i' } },
      ];
    }

    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.chronicConditionModel
        .find(query)
        .sort({ diagnosisDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.chronicConditionModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async findByStatus(status: string, hospitalId?: string): Promise<ChronicConditionDocument[]> {
    const query: FilterQuery<ChronicConditionDocument> = {
      status,
      deletedAt: null,
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.chronicConditionModel.find(query).sort({ diagnosisDate: -1 }).exec();
  }

  async findRequiringReview(hospitalId?: string): Promise<ChronicConditionDocument[]> {
    const today = new Date();
    const query: FilterQuery<ChronicConditionDocument> = {
      status: 'active',
      nextReviewDate: { $lte: today },
      deletedAt: null,
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.chronicConditionModel.find(query).sort({ nextReviewDate: 1 }).exec();
  }

  async findActiveConditions(patientId: string): Promise<ChronicConditionDocument[]> {
    return this.chronicConditionModel
      .find({
        patientId,
        status: 'active',
        deletedAt: null,
      })
      .sort({ diagnosisDate: -1 })
      .exec();
  }

  async findWithActiveMedications(patientId: string): Promise<ChronicConditionDocument[]> {
    return this.chronicConditionModel
      .find({
        patientId,
        status: 'active',
        'medications.isActive': true,
        deletedAt: null,
      })
      .sort({ diagnosisDate: -1 })
      .exec();
  }

  async searchConditions(
    searchTerm: string,
    hospitalId?: string,
  ): Promise<ChronicConditionDocument[]> {
    const query: FilterQuery<ChronicConditionDocument> = {
      deletedAt: null,
      $or: [
        { conditionName: { $regex: searchTerm, $options: 'i' } },
        { icd10Code: { $regex: searchTerm, $options: 'i' } },
        { snomedCode: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.chronicConditionModel.find(query).sort({ diagnosisDate: -1 }).exec();
  }

  async countByPatient(patientId: string): Promise<number> {
    return this.chronicConditionModel.countDocuments({ patientId, deletedAt: null }).exec();
  }

  async findOverdueReviews(patientId: string): Promise<ChronicConditionDocument[]> {
    const today = new Date();
    return this.chronicConditionModel
      .find({
        patientId,
        status: 'active',
        nextReviewDate: { $lt: today },
        deletedAt: null,
      })
      .sort({ nextReviewDate: 1 })
      .exec();
  }
}
