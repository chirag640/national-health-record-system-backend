import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, FilterQuery } from 'mongoose';
import { Prescription, PrescriptionDocument } from './schemas/prescription.schema';
import { BaseRepository } from '../../common/base.repository';
import { PrescriptionFilterDto } from './dto/prescription-filter.dto';

@Injectable()
export class PrescriptionRepository extends BaseRepository<PrescriptionDocument> {
  protected readonly logger = new Logger(PrescriptionRepository.name);

  constructor(
    @InjectModel(Prescription.name) private prescriptionModel: Model<PrescriptionDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(prescriptionModel, connection);
  }

  /**
   * Find prescriptions with filters and pagination
   */
  async findWithFilters(filters: PrescriptionFilterDto): Promise<{
    data: PrescriptionDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      patient,
      patientGuid,
      prescriber,
      encounter,
      organization,
      status,
      priority,
      medicationName,
      authoredOnStart,
      authoredOnEnd,
      isControlledSubstance,
      isExpired,
      hasRefillsAvailable,
      page = 1,
      limit = 20,
      sortBy = 'authoredOn',
      sortOrder = 'desc',
    } = filters;

    const query: FilterQuery<PrescriptionDocument> = { isDeleted: false };

    if (patient) {
      query.patient = patient;
    }
    if (patientGuid) {
      query.patientGuid = patientGuid;
    }
    if (prescriber) {
      query.prescriber = prescriber;
    }
    if (encounter) {
      query.encounter = encounter;
    }
    if (organization) {
      query.organization = organization;
    }
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (medicationName) {
      query.$or = [
        { medicationName: new RegExp(medicationName, 'i') },
        { genericName: new RegExp(medicationName, 'i') },
      ];
    }

    // Date range filter
    if (authoredOnStart || authoredOnEnd) {
      query.authoredOn = {};
      if (authoredOnStart) {
        (query.authoredOn as any).$gte = new Date(authoredOnStart);
      }
      if (authoredOnEnd) {
        (query.authoredOn as any).$lte = new Date(authoredOnEnd);
      }
    }

    if (isControlledSubstance !== undefined) {
      query.isControlledSubstance = isControlledSubstance;
    }

    // Handle expired prescriptions filter
    if (isExpired) {
      query['dispenseRequest.validityPeriodEnd'] = { $lt: new Date() };
    }

    // Handle refills available filter
    if (hasRefillsAvailable) {
      query.$expr = {
        $gt: [{ $ifNull: ['$dispenseRequest.numberOfRepeatsAllowed', 0] }, '$dispensedCount'],
      };
    }

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.prescriptionModel
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('patient', 'name email phone')
        .populate('prescriber', 'name specialization licenseNumber')
        .populate('organization', 'name address')
        .populate('patient', 'name email phone')
        .populate('prescriber', 'name specialization licenseNumber')
        .populate('organization', 'name address')
        .exec(),
      this.prescriptionModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get active prescriptions for a patient
   */
  async findActiveByPatient(patientId: string): Promise<PrescriptionDocument[]> {
    return this.prescriptionModel
      .find({
        patient: patientId,
        status: { $in: ['active', 'on-hold'] },
        isDeleted: false,
      })
      .sort({ authoredOn: -1 })
      .populate('prescriber', 'name specialization')
      .populate('organization', 'name')
      .exec();
  }

  /**
   * Get prescriptions by encounter
   */
  async findByEncounter(encounterId: string): Promise<PrescriptionDocument[]> {
    return this.prescriptionModel
      .find({
        encounter: encounterId,
        isDeleted: false,
      })
      .sort({ authoredOn: -1 })
      .populate('prescriber', 'name specialization')
      .exec();
  }

  /**
   * Find prescriptions by prescriber with date range
   */
  async findByPrescriberAndDateRange(
    prescriberId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PrescriptionDocument[]> {
    return this.prescriptionModel
      .find({
        prescriber: prescriberId,
        authoredOn: { $gte: startDate, $lte: endDate },
        isDeleted: false,
      })
      .sort({ authoredOn: -1 })
      .populate('patient', 'name phone')
      .populate('organization', 'name')
      .exec();
  }

  /**
   * Find expiring prescriptions (within next N days)
   */
  async findExpiringPrescriptions(daysAhead: number = 7): Promise<PrescriptionDocument[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.prescriptionModel
      .find({
        status: 'active',
        'dispenseRequest.validityPeriodEnd': {
          $gte: now,
          $lte: futureDate,
        },
        isDeleted: false,
      })
      .sort({ 'dispenseRequest.validityPeriodEnd': 1 })
      .populate('patient', 'name email phone')
      .populate('prescriber', 'name')
      .exec();
  }

  /**
   * Find prescriptions needing refill (low refills remaining)
   */
  async findNeedingRefill(patientId: string): Promise<PrescriptionDocument[]> {
    return this.prescriptionModel
      .find({
        patient: patientId,
        status: 'active',
        isDeleted: false,
        $expr: {
          $and: [
            { $gt: [{ $ifNull: ['$dispenseRequest.numberOfRepeatsAllowed', 0] }, 0] },
            {
              $lte: [
                {
                  $subtract: [
                    { $ifNull: ['$dispenseRequest.numberOfRepeatsAllowed', 0] },
                    '$dispensedCount',
                  ],
                },
                1,
              ],
            },
          ],
        },
      })
      .sort({ 'dispenseRequest.validityPeriodEnd': 1 })
      .exec();
  }

  /**
   * Find by prescription number
   */
  async findByPrescriptionNumber(prescriptionNumber: string): Promise<PrescriptionDocument | null> {
    return this.prescriptionModel
      .findOne({
        prescriptionNumber,
        isDeleted: false,
      })
      .populate('patient', 'name email phone guid')
      .populate('prescriber', 'name specialization licenseNumber')
      .populate('organization', 'name address contact')
      .populate('encounter')
      .exec();
  }

  /**
   * Update dispense count when medication is dispensed
   */
  async incrementDispenseCount(prescriptionId: string) {
    return this.prescriptionModel
      .findByIdAndUpdate(
        prescriptionId,
        {
          $inc: { dispensedCount: 1 },
          $set: { lastDispensedDate: new Date() },
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Find controlled substances by prescriber (for auditing)
   */
  async findControlledSubstancesByPrescriber(
    prescriberId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PrescriptionDocument[]> {
    return this.prescriptionModel
      .find({
        prescriber: prescriberId,
        isControlledSubstance: true,
        authoredOn: { $gte: startDate, $lte: endDate },
        isDeleted: false,
      })
      .sort({ authoredOn: -1 })
      .populate('patient', 'name guid')
      .exec();
  }

  /**
   * Get prescription statistics for a patient
   */
  async getPatientPrescriptionStats(patientId: string) {
    const stats = await this.prescriptionModel.aggregate([
      {
        $match: {
          patient: patientId,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await this.prescriptionModel.countDocuments({
      patient: patientId,
      isDeleted: false,
    });

    return {
      total,
      byStatus: stats.reduce((acc: Record<string, number>, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  }

  /**
   * Search prescriptions by medication name (text search)
   */
  async searchByMedication(
    searchTerm: string,
    limit: number = 20,
  ): Promise<PrescriptionDocument[]> {
    return this.prescriptionModel
      .find(
        {
          $text: { $search: searchTerm },
          isDeleted: false,
        },
        { score: { $meta: 'textScore' } },
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .populate('patient', 'name')
      .populate('prescriber', 'name')
      .exec();
  }
}
