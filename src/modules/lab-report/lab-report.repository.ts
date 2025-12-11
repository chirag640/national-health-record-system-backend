import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { LabReport, LabReportDocument } from './schemas/lab-report.schema';
import { LabReportFilterDto } from './dto/lab-report-filter.dto';
import { LabReportStatistics, LabReportTrendItem } from './interfaces/lab-report-types.interface';

@Injectable()
export class LabReportRepository {
  constructor(
    @InjectModel(LabReport.name)
    private readonly labReportModel: Model<LabReportDocument>,
  ) {}

  /**
   * Create a new lab report
   */
  async create(data: Partial<LabReport>): Promise<LabReportDocument> {
    const labReport = new this.labReportModel(data);
    return labReport.save();
  }

  /**
   * Find lab report by ID
   */
  async findById(id: string): Promise<LabReportDocument | null> {
    return this.labReportModel
      .findOne({ _id: id, deletedAt: null })
      .populate('doctorId', 'fullName specialization')
      .populate('hospitalId', 'name address')
      .populate('appointmentId')
      .exec();
  }

  /**
   * Find lab report by report ID
   */
  async findByReportId(reportId: string): Promise<LabReportDocument | null> {
    return this.labReportModel
      .findOne({ reportId, deletedAt: null })
      .populate('doctorId', 'fullName specialization')
      .populate('hospitalId', 'name address')
      .exec();
  }

  /**
   * Find all lab reports with filters and pagination
   */
  async findAll(filterDto: LabReportFilterDto): Promise<{
    data: LabReportDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      fromDate,
      toDate,
      ...filters
    } = filterDto;

    const query: FilterQuery<LabReportDocument> = { deletedAt: null };

    // Apply filters
    if (filters.patientId) {
      query.patientId = filters.patientId;
    }
    if (filters.doctorId) {
      query.doctorId = filters.doctorId;
    }
    if (filters.hospitalId) {
      query.hospitalId = filters.hospitalId;
    }
    if (filters.appointmentId) {
      query.appointmentId = filters.appointmentId;
    }
    if (filters.encounterId) {
      query.encounterId = filters.encounterId;
    }
    if (filters.testCategory) {
      query.testCategory = filters.testCategory;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.reportId) {
      query.reportId = filters.reportId;
    }

    // Date range filter
    if (fromDate || toDate) {
      query.reportDate = {};
      if (fromDate) {
        query.reportDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.reportDate.$lte = new Date(toDate);
      }
    }

    // Text search
    if (filters.testName) {
      query.$text = { $search: filters.testName };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [data, total] = await Promise.all([
      this.labReportModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('doctorId', 'fullName specialization')
        .populate('hospitalId', 'name address')
        .exec(),
      this.labReportModel.countDocuments(query),
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
   * Find lab reports by patient ID
   */
  async findByPatientId(patientId: string): Promise<LabReportDocument[]> {
    return this.labReportModel
      .find({ patientId, deletedAt: null })
      .sort({ reportDate: -1 })
      .populate('doctorId', 'fullName specialization')
      .populate('hospitalId', 'name address')
      .exec();
  }

  /**
   * Find lab reports by doctor ID
   */
  async findByDoctorId(doctorId: string): Promise<LabReportDocument[]> {
    return this.labReportModel
      .find({ doctorId, deletedAt: null })
      .sort({ reportDate: -1 })
      .populate('hospitalId', 'name address')
      .exec();
  }

  /**
   * Find lab reports by hospital ID
   */
  async findByHospitalId(hospitalId: string): Promise<LabReportDocument[]> {
    return this.labReportModel
      .find({ hospitalId, deletedAt: null })
      .sort({ reportDate: -1 })
      .populate('doctorId', 'fullName specialization')
      .exec();
  }

  /**
   * Update lab report
   */
  async update(id: string, data: Partial<LabReport>): Promise<LabReportDocument | null> {
    return this.labReportModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true })
      .populate('doctorId', 'fullName specialization')
      .populate('hospitalId', 'name address')
      .exec();
  }

  /**
   * Soft delete lab report
   */
  async softDelete(id: string): Promise<LabReportDocument | null> {
    return this.labReportModel
      .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
      .exec();
  }

  /**
   * Get lab report statistics
   */
  async getStatistics(filters?: Partial<LabReportFilterDto>): Promise<LabReportStatistics> {
    const query: FilterQuery<LabReportDocument> = { deletedAt: null };

    if (filters?.patientId) {
      query.patientId = filters.patientId;
    }
    if (filters?.doctorId) {
      query.doctorId = filters.doctorId;
    }
    if (filters?.hospitalId) {
      query.hospitalId = filters.hospitalId;
    }

    const [total, statusCounts, categoryCounts, criticalCount, abnormalCount] = await Promise.all([
      this.labReportModel.countDocuments(query),
      this.labReportModel.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.labReportModel.aggregate([
        { $match: query },
        { $group: { _id: '$testCategory', count: { $sum: 1 } } },
      ]),
      this.labReportModel.countDocuments({
        ...query,
        'results.status': 'critical',
      }),
      this.labReportModel.countDocuments({
        ...query,
        'results.status': { $in: ['abnormal', 'critical', 'borderline'] },
      }),
    ]);

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const categoryMap = categoryCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return {
      total,
      pending: statusMap['pending'] || 0,
      collected: statusMap['collected'] || 0,
      inProgress: statusMap['in-progress'] || 0,
      completed: statusMap['completed'] || 0,
      reviewed: statusMap['reviewed'] || 0,
      cancelled: statusMap['cancelled'] || 0,
      critical: criticalCount,
      abnormal: abnormalCount,
      byCategory: categoryMap,
    };
  }

  /**
   * Get trend analysis for specific test parameter
   */
  async getTrendAnalysis(
    patientId: string,
    parameterName: string,
    limit: number = 10,
  ): Promise<LabReportTrendItem[]> {
    return this.labReportModel.aggregate([
      {
        $match: {
          patientId,
          deletedAt: null,
          status: { $in: ['completed', 'reviewed'] },
        },
      },
      { $unwind: '$results' },
      {
        $match: {
          'results.parameterName': { $regex: new RegExp(parameterName, 'i') },
        },
      },
      {
        $project: {
          reportId: 1,
          reportDate: 1,
          parameterName: '$results.parameterName',
          value: '$results.value',
          unit: '$results.unit',
          status: '$results.status',
          normalRange: '$results.normalRange',
        },
      },
      { $sort: { reportDate: -1 } },
      { $limit: limit },
    ]) as unknown as Promise<LabReportTrendItem[]>;
  }

  /**
   * Find reports with critical results
   */
  async findCriticalReports(hospitalId?: string): Promise<LabReportDocument[]> {
    const query: FilterQuery<LabReportDocument> = {
      deletedAt: null,
      'results.status': 'critical',
      criticalNotificationSent: false,
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.labReportModel
      .find(query)
      .populate('doctorId', 'fullName specialization')
      .populate('hospitalId', 'name address')
      .exec();
  }

  /**
   * Mark critical notification as sent
   */
  async markCriticalNotificationSent(id: string): Promise<void> {
    await this.labReportModel.findByIdAndUpdate(id, {
      criticalNotificationSent: true,
    });
  }

  /**
   * Mark patient notification as sent
   */
  async markPatientNotified(id: string): Promise<void> {
    await this.labReportModel.findByIdAndUpdate(id, {
      patientNotified: true,
    });
  }

  /**
   * Mark doctor notification as sent
   */
  async markDoctorNotified(id: string): Promise<void> {
    await this.labReportModel.findByIdAndUpdate(id, {
      doctorNotified: true,
    });
  }

  /**
   * Get recent lab reports (for dashboard)
   */
  async getRecentReports(limit: number = 10, hospitalId?: string): Promise<LabReportDocument[]> {
    const query: FilterQuery<LabReportDocument> = { deletedAt: null };
    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.labReportModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('doctorId', 'fullName specialization')
      .populate('hospitalId', 'name address')
      .exec();
  }
}
