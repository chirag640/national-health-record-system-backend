import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, FilterQuery, Connection } from 'mongoose';
import { Allergy, AllergyDocument } from '../schemas/allergy.schema';
import { AllergyFilterDto } from '../dto/allergy.dto';
import { BaseRepository } from '../../../common/base.repository';

@Injectable()
export class AllergyRepository extends BaseRepository<AllergyDocument> {
  constructor(
    @InjectModel(Allergy.name)
    private allergyModel: Model<AllergyDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(allergyModel, connection);
  }

  async create(createDto: any): Promise<AllergyDocument> {
    const allergy = new this.allergyModel(createDto);
    return allergy.save();
  }

  async findById(id: string): Promise<AllergyDocument | null> {
    return this.allergyModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async update(id: string, updateDto: any): Promise<AllergyDocument | null> {
    return this.allergyModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, { $set: updateDto }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.allergyModel
      .updateOne({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } })
      .exec();
    return result.modifiedCount > 0;
  }

  async findByPatient(
    patientId: string,
    filterDto?: AllergyFilterDto,
  ): Promise<{ data: AllergyDocument[]; total: number }> {
    const query: FilterQuery<AllergyDocument> = {
      patientId,
      deletedAt: null,
    };

    if (filterDto?.type) {
      query.allergyType = filterDto.type;
    }

    if (filterDto?.severity) {
      query.severity = filterDto.severity;
    }

    if (filterDto?.status) {
      query.status = filterDto.status;
    }

    if (filterDto?.search) {
      query.$or = [
        { allergen: { $regex: filterDto.search, $options: 'i' } },
        { notes: { $regex: filterDto.search, $options: 'i' } },
      ];
    }

    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.allergyModel.find(query).sort({ identifiedDate: -1 }).skip(skip).limit(limit).exec(),
      this.allergyModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async findByType(allergyType: string, hospitalId?: string): Promise<AllergyDocument[]> {
    const query: FilterQuery<AllergyDocument> = {
      allergyType,
      deletedAt: null,
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.allergyModel.find(query).sort({ identifiedDate: -1 }).exec();
  }

  async findBySeverity(severity: string, patientId?: string): Promise<AllergyDocument[]> {
    const query: FilterQuery<AllergyDocument> = {
      severity,
      deletedAt: null,
    };

    if (patientId) {
      query.patientId = patientId;
    }

    return this.allergyModel.find(query).sort({ identifiedDate: -1 }).exec();
  }

  async findActiveAllergies(patientId: string): Promise<AllergyDocument[]> {
    return this.allergyModel
      .find({
        patientId,
        status: 'active',
        deletedAt: null,
      })
      .sort({ severity: 1, identifiedDate: -1 })
      .exec();
  }

  async searchAllergies(searchTerm: string, hospitalId?: string): Promise<AllergyDocument[]> {
    const query: FilterQuery<AllergyDocument> = {
      deletedAt: null,
      $or: [
        { allergen: { $regex: searchTerm, $options: 'i' } },
        { notes: { $regex: searchTerm, $options: 'i' } },
        { snomedCode: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.allergyModel.find(query).sort({ identifiedDate: -1 }).exec();
  }

  async countByPatient(patientId: string): Promise<number> {
    return this.allergyModel.countDocuments({ patientId, deletedAt: null }).exec();
  }

  async findCriticalAllergies(patientId: string): Promise<AllergyDocument[]> {
    return this.allergyModel
      .find({
        patientId,
        severity: { $in: ['severe', 'life-threatening'] },
        status: 'active',
        deletedAt: null,
      })
      .sort({ severity: 1 })
      .exec();
  }
}
