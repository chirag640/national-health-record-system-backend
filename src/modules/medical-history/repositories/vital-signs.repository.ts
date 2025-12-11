import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, FilterQuery, Connection } from 'mongoose';
import { VitalSigns, VitalSignsDocument } from '../schemas/vital-signs.schema';
import { UpdateVitalSignsDto, VitalSignsFilterDto } from '../dto/vital-signs.dto';
import { BaseRepository } from '../../../common/base.repository';

@Injectable()
export class VitalSignsRepository extends BaseRepository<VitalSignsDocument> {
  constructor(
    @InjectModel(VitalSigns.name)
    private vitalSignsModel: Model<VitalSignsDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(vitalSignsModel, connection);
  }

  async create(createDto: any): Promise<VitalSignsDocument> {
    const vitalSigns = new this.vitalSignsModel(createDto);
    return vitalSigns.save(); // pre-save middleware will calculate BMI and abnormal values
  }

  async findById(id: string): Promise<VitalSignsDocument | null> {
    return this.vitalSignsModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async update(id: string, updateDto: UpdateVitalSignsDto): Promise<VitalSignsDocument | null> {
    return this.vitalSignsModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, { $set: updateDto }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.vitalSignsModel
      .updateOne({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } })
      .exec();
    return result.modifiedCount > 0;
  }

  async findByPatient(
    patientId: string,
    filterDto?: VitalSignsFilterDto,
  ): Promise<{ data: VitalSignsDocument[]; total: number }> {
    const query: FilterQuery<VitalSignsDocument> = {
      patientId,
      deletedAt: null,
    };

    if (filterDto?.encounterId) {
      query.encounterId = filterDto.encounterId;
    }

    if (filterDto?.startDate || filterDto?.endDate) {
      query.recordedAt = {};
      if (filterDto.startDate) {
        query.recordedAt.$gte = filterDto.startDate;
      }
      if (filterDto.endDate) {
        query.recordedAt.$lte = filterDto.endDate;
      }
    }

    if (filterDto?.hasAbnormalValues !== undefined) {
      query.hasAbnormalValues = filterDto.hasAbnormalValues;
    }

    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.vitalSignsModel.find(query).sort({ recordedAt: -1 }).skip(skip).limit(limit).exec(),
      this.vitalSignsModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async findByDateRange(
    patientId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<VitalSignsDocument[]> {
    return this.vitalSignsModel
      .find({
        patientId,
        recordedAt: { $gte: startDate, $lte: endDate },
        deletedAt: null,
      })
      .sort({ recordedAt: -1 })
      .exec();
  }

  async getLatest(patientId: string): Promise<VitalSignsDocument | null> {
    return this.vitalSignsModel
      .findOne({
        patientId,
        deletedAt: null,
      })
      .sort({ recordedAt: -1 })
      .exec();
  }

  async getTrends(patientId: string, days: number = 30): Promise<VitalSignsDocument[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.vitalSignsModel
      .find({
        patientId,
        recordedAt: { $gte: startDate },
        deletedAt: null,
      })
      .sort({ recordedAt: 1 })
      .exec();
  }

  async findAbnormal(patientId?: string, hospitalId?: string): Promise<VitalSignsDocument[]> {
    const query: FilterQuery<VitalSignsDocument> = {
      hasAbnormalValues: true,
      deletedAt: null,
    };

    if (patientId) {
      query.patientId = patientId;
    }

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.vitalSignsModel.find(query).sort({ recordedAt: -1 }).exec();
  }

  async findByEncounter(encounterId: string): Promise<VitalSignsDocument[]> {
    return this.vitalSignsModel
      .find({
        encounterId,
        deletedAt: null,
      })
      .sort({ recordedAt: -1 })
      .exec();
  }

  async findByTelemedicineSession(sessionId: string): Promise<VitalSignsDocument[]> {
    return this.vitalSignsModel
      .find({
        telemedicineSessionId: sessionId,
        deletedAt: null,
      })
      .sort({ recordedAt: -1 })
      .exec();
  }

  async countByPatient(patientId: string): Promise<number> {
    return this.vitalSignsModel.countDocuments({ patientId, deletedAt: null }).exec();
  }

  async getAverageVitals(
    patientId: string,
    days: number = 30,
  ): Promise<{
    avgSystolicBP?: number;
    avgDiastolicBP?: number;
    avgHeartRate?: number;
    avgTemperature?: number;
    avgOxygenSaturation?: number;
    avgBloodGlucose?: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.vitalSignsModel
      .aggregate([
        {
          $match: {
            patientId,
            recordedAt: { $gte: startDate },
            deletedAt: null,
          },
        },
        {
          $group: {
            _id: null,
            avgSystolicBP: { $avg: '$systolicBP' },
            avgDiastolicBP: { $avg: '$diastolicBP' },
            avgHeartRate: { $avg: '$heartRate' },
            avgTemperature: { $avg: '$temperature' },
            avgOxygenSaturation: { $avg: '$oxygenSaturation' },
            avgBloodGlucose: { $avg: '$bloodGlucose' },
          },
        },
      ])
      .exec();

    return result[0] || {};
  }

  async findCriticalVitals(hospitalId?: string): Promise<VitalSignsDocument[]> {
    const query: FilterQuery<VitalSignsDocument> = {
      hasAbnormalValues: true,
      deletedAt: null,
      $or: [
        { systolicBP: { $gte: 180 } }, // Hypertensive crisis
        { systolicBP: { $lte: 90 } }, // Hypotension
        { heartRate: { $gte: 120 } }, // Tachycardia
        { heartRate: { $lte: 40 } }, // Bradycardia
        { oxygenSaturation: { $lte: 90 } }, // Low O2
        { temperature: { $gte: 39 } }, // High fever (Celsius)
      ],
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.vitalSignsModel.find(query).sort({ recordedAt: -1 }).limit(50).exec();
  }
}
