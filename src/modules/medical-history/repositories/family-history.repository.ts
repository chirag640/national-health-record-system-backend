import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, FilterQuery, Connection } from 'mongoose';
import { FamilyHistory, FamilyHistoryDocument } from '../schemas/family-history.schema';
import { FamilyHistoryFilterDto } from '../dto/family-history.dto';
import { BaseRepository } from '../../../common/base.repository';

@Injectable()
export class FamilyHistoryRepository extends BaseRepository<FamilyHistoryDocument> {
  constructor(
    @InjectModel(FamilyHistory.name)
    private familyHistoryModel: Model<FamilyHistoryDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(familyHistoryModel, connection);
  }

  async create(createDto: any): Promise<FamilyHistoryDocument> {
    const history = new this.familyHistoryModel(createDto);
    return history.save();
  }

  async findById(id: string): Promise<FamilyHistoryDocument | null> {
    return this.familyHistoryModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async update(id: string, updateDto: any): Promise<FamilyHistoryDocument | null> {
    return this.familyHistoryModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, { $set: updateDto }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.familyHistoryModel
      .updateOne({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } })
      .exec();
    return result.modifiedCount > 0;
  }

  async findByPatient(
    patientId: string,
    filterDto?: FamilyHistoryFilterDto,
  ): Promise<{ data: FamilyHistoryDocument[]; total: number }> {
    const query: FilterQuery<FamilyHistoryDocument> = {
      patientId,
      deletedAt: null,
    };

    if (filterDto?.relationship) {
      query.relationship = filterDto.relationship;
    }

    if (filterDto?.condition) {
      query.condition = { $regex: filterDto.condition, $options: 'i' };
    }

    if (filterDto?.search) {
      query.$or = [
        { condition: { $regex: filterDto.search, $options: 'i' } },
        { relativeName: { $regex: filterDto.search, $options: 'i' } },
        { notes: { $regex: filterDto.search, $options: 'i' } },
      ];
    }

    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.familyHistoryModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.familyHistoryModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async findByRelationship(
    relationship: string,
    patientId?: string,
  ): Promise<FamilyHistoryDocument[]> {
    const query: FilterQuery<FamilyHistoryDocument> = {
      relationship,
      deletedAt: null,
    };

    if (patientId) {
      query.patientId = patientId;
    }

    return this.familyHistoryModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async getRiskAssessment(patientId: string): Promise<FamilyHistoryDocument[]> {
    return this.familyHistoryModel
      .find({
        patientId,
        patientRiskLevel: { $in: ['Moderate', 'High'] },
        deletedAt: null,
      })
      .sort({ patientRiskLevel: -1 })
      .exec();
  }

  async findByCondition(condition: string, hospitalId?: string): Promise<FamilyHistoryDocument[]> {
    const query: FilterQuery<FamilyHistoryDocument> = {
      condition: { $regex: condition, $options: 'i' },
      deletedAt: null,
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.familyHistoryModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findWithInheritancePattern(patientId: string): Promise<FamilyHistoryDocument[]> {
    return this.familyHistoryModel
      .find({
        patientId,
        inheritancePattern: { $exists: true, $ne: null },
        deletedAt: null,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async countByPatient(patientId: string): Promise<number> {
    return this.familyHistoryModel.countDocuments({ patientId, deletedAt: null }).exec();
  }

  async searchFamilyHistory(
    searchTerm: string,
    hospitalId?: string,
  ): Promise<FamilyHistoryDocument[]> {
    const query: FilterQuery<FamilyHistoryDocument> = {
      deletedAt: null,
      $or: [
        { condition: { $regex: searchTerm, $options: 'i' } },
        { icd10Code: { $regex: searchTerm, $options: 'i' } },
        { snomedCode: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.familyHistoryModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async getHighRiskConditions(patientId: string): Promise<FamilyHistoryDocument[]> {
    return this.familyHistoryModel
      .find({
        patientId,
        patientRiskLevel: 'High',
        deletedAt: null,
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}
