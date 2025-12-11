import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, FilterQuery, Connection } from 'mongoose';
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';
import { BaseRepository } from '../../../common/base.repository';

export interface InvoiceStatistics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  averageInvoiceAmount: number;
  byStatus: {
    draft: number;
    pending: number;
    partially_paid: number;
    paid: number;
    overdue: number;
    cancelled: number;
    refunded: number;
  };
}

@Injectable()
export class InvoiceRepository extends BaseRepository<InvoiceDocument> {
  protected readonly logger = new Logger(InvoiceRepository.name);

  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(invoiceModel, connection);
  }

  /**
   * Find invoice by invoice number
   */
  async findByInvoiceNumber(invoiceNumber: string): Promise<InvoiceDocument | null> {
    return this.invoiceModel
      .findOne({ invoiceNumber, deletedAt: null })
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name address')
      .exec();
  }

  /**
   * Find all invoices with advanced filtering
   */
  async findAllWithFilters(filters: {
    page?: number;
    limit?: number;
    status?: string;
    patientId?: string;
    hospitalId?: string;
    doctorId?: string;
    appointmentId?: string;
    encounterType?: string;
    serviceType?: string;
    paymentStatus?: string;
    insuranceStatus?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<{
    invoices: InvoiceDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      status,
      patientId,
      doctorId,
      hospitalId,
      appointmentId,
      encounterType,
      serviceType,
      paymentStatus,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      insuranceStatus,
      search,
    } = filters;

    const query: FilterQuery<Invoice> = { deletedAt: null };

    // Status filters
    if (status) {
      query.status = status;
    }

    // Entity filters
    if (patientId) {
      query.patientId = patientId;
    }
    if (doctorId) {
      query.doctorId = doctorId;
    }
    if (hospitalId) {
      query.hospitalId = hospitalId;
    }
    if (appointmentId) {
      query.appointmentId = appointmentId;
    }

    // Type filters
    if (encounterType) {
      query.encounterType = encounterType;
    }
    if (serviceType) {
      query.serviceType = serviceType;
    }

    // Payment status filter
    if (paymentStatus) {
      if (paymentStatus === 'unpaid') {
        query.status = { $in: ['pending', 'overdue'] };
        query.paidAmount = 0;
      } else if (paymentStatus === 'partially_paid') {
        query.status = 'partially_paid';
      } else if (paymentStatus === 'paid') {
        query.status = 'paid';
      }
    }

    // Date range filter
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) {
        query.invoiceDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.invoiceDate.$lte = new Date(endDate);
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.totalAmount = {};
      if (minAmount) {
        query.totalAmount.$gte = minAmount;
      }
      if (maxAmount) {
        query.totalAmount.$lte = maxAmount;
      }
    }

    // Insurance status filter
    if (insuranceStatus) {
      if (insuranceStatus === 'claimed') {
        query['insuranceClaim.status'] = { $in: ['submitted', 'approved', 'paid'] };
      } else if (insuranceStatus === 'not_claimed') {
        query.insuranceClaim = { $exists: false };
      } else if (insuranceStatus === 'rejected') {
        query['insuranceClaim.status'] = 'rejected';
      }
    }

    // Search filter (invoice number or patient name)
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      this.invoiceModel
        .find(query)
        .populate('patientId', 'name email phone')
        .populate('doctorId', 'name specialization')
        .populate('hospitalId', 'name')
        .sort({ invoiceDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.invoiceModel.countDocuments(query),
    ]);

    return { invoices, total, page, limit };
  }

  /**
   * Update invoice payment status
   */
  async updatePaymentStatus(
    invoiceId: string,
    paidAmount: number,
  ): Promise<InvoiceDocument | null> {
    const invoice = await this.findById(invoiceId);
    if (!invoice) {
      return null;
    }

    const newPaidAmount = paidAmount;
    let newStatus = invoice.status;

    if (newPaidAmount >= invoice.totalAmount) {
      newStatus = 'paid' as any;
    } else if (newPaidAmount > 0) {
      newStatus = 'partially-paid' as any;
    }

    return this.invoiceModel
      .findByIdAndUpdate(
        invoiceId,
        {
          paidAmount: newPaidAmount,
          status: newStatus,
          lastPaymentDate: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Add payment record to invoice
   */
  async addPaymentRecord(
    invoiceId: string,
    paymentRecord: {
      paymentId: string;
      amount: number;
      paymentDate: Date;
      paymentMethod: string;
      transactionId?: string;
    },
  ): Promise<InvoiceDocument | null> {
    return this.invoiceModel
      .findByIdAndUpdate(
        invoiceId,
        {
          $push: { payments: paymentRecord },
          $inc: { paidAmount: paymentRecord.amount },
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Update insurance claim information
   */
  async updateInsuranceClaim(
    invoiceId: string,
    claimData: {
      status?: string;
      claimNumber?: string;
      submittedDate?: Date;
      approvedAmount?: number;
      rejectionReason?: string;
      paidDate?: Date;
    },
  ): Promise<InvoiceDocument | null> {
    const updateFields: Record<string, unknown> = {};

    Object.entries(claimData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields[`insuranceClaim.${key}`] = value;
      }
    });

    return this.invoiceModel
      .findByIdAndUpdate(invoiceId, { $set: updateFields }, { new: true })
      .exec();
  }

  /**
   * Get overdue invoices
   */
  async findOverdueInvoices(hospitalId?: string): Promise<InvoiceDocument[]> {
    const query: FilterQuery<Invoice> = {
      status: { $in: ['pending', 'partially_paid'] },
      dueDate: { $lt: new Date() },
      deletedAt: null,
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.invoiceModel
      .find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name')
      .populate('hospitalId', 'name')
      .sort({ dueDate: 1 })
      .exec();
  }

  /**
   * Get invoices by patient
   */
  async findByPatient(patientId: string, limit: number = 10): Promise<InvoiceDocument[]> {
    return this.invoiceModel
      .find({ patientId, deletedAt: null })
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name')
      .sort({ invoiceDate: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get invoices by doctor
   */
  async findByDoctor(
    doctorId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<InvoiceDocument[]> {
    const query: FilterQuery<Invoice> = {
      doctorId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) {
        query.invoiceDate.$gte = startDate;
      }
      if (endDate) {
        query.invoiceDate.$lte = endDate;
      }
    }

    return this.invoiceModel
      .find(query)
      .populate('patientId', 'name')
      .populate('hospitalId', 'name')
      .sort({ invoiceDate: -1 })
      .exec();
  }

  /**
   * Get invoices by hospital
   */
  async findByHospital(
    hospitalId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<InvoiceDocument[]> {
    const query: FilterQuery<Invoice> = {
      hospitalId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) {
        query.invoiceDate.$gte = startDate;
      }
      if (endDate) {
        query.invoiceDate.$lte = endDate;
      }
    }

    return this.invoiceModel
      .find(query)
      .populate('patientId', 'name')
      .populate('doctorId', 'name specialization')
      .sort({ invoiceDate: -1 })
      .exec();
  }

  /**
   * Get billing statistics
   */
  async getStatistics(
    hospitalId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<InvoiceStatistics> {
    const query: FilterQuery<Invoice> = { deletedAt: null };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) {
        query.invoiceDate.$gte = startDate;
      }
      if (endDate) {
        query.invoiceDate.$lte = endDate;
      }
    }

    const invoices = await this.invoiceModel.find(query).exec();

    const stats: InvoiceStatistics = {
      totalInvoices: invoices.length,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      averageInvoiceAmount: 0,
      byStatus: {
        draft: 0,
        pending: 0,
        partially_paid: 0,
        paid: 0,
        overdue: 0,
        cancelled: 0,
        refunded: 0,
      },
    };

    const now = new Date();

    invoices.forEach((invoice) => {
      stats.totalAmount += invoice.totalAmount;
      stats.paidAmount += invoice.paidAmount;
      const statusKey = invoice.status.replace('-', '_') as keyof typeof stats.byStatus;
      if (stats.byStatus[statusKey] !== undefined) {
        stats.byStatus[statusKey]++;
      }

      if (['pending', 'partially_paid'].includes(invoice.status) && invoice.dueDate < now) {
        stats.overdueAmount += invoice.totalAmount - invoice.paidAmount;
      } else if (['pending', 'partially_paid'].includes(invoice.status)) {
        stats.pendingAmount += invoice.totalAmount - invoice.paidAmount;
      }
    });

    stats.averageInvoiceAmount =
      stats.totalInvoices > 0 ? stats.totalAmount / stats.totalInvoices : 0;

    return stats;
  }

  /**
   * Mark invoice as cancelled
   */
  async cancelInvoice(invoiceId: string, reason: string): Promise<InvoiceDocument | null> {
    return this.invoiceModel
      .findByIdAndUpdate(
        invoiceId,
        {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Mark invoice as refunded
   */
  async markAsRefunded(invoiceId: string): Promise<InvoiceDocument | null> {
    return this.invoiceModel
      .findByIdAndUpdate(
        invoiceId,
        {
          status: 'refunded',
          refundedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Update invoice due date and check for overdue status
   */
  async checkAndUpdateOverdueInvoices(): Promise<number> {
    const result = await this.invoiceModel.updateMany(
      {
        status: { $in: ['pending', 'partially_paid'] },
        dueDate: { $lt: new Date() },
        deletedAt: null,
      },
      {
        $set: { status: 'overdue' },
      },
    );

    this.logger.log(`Updated ${result.modifiedCount} invoices to overdue status`);
    return result.modifiedCount;
  }

  /**
   * Get revenue summary by service type
   */
  async getRevenueByServiceType(
    hospitalId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ serviceType: string; totalRevenue: number; count: number }[]> {
    const matchStage: FilterQuery<Invoice> = { deletedAt: null, status: 'paid' };

    if (hospitalId) {
      matchStage.hospitalId = hospitalId;
    }
    if (startDate || endDate) {
      matchStage.invoiceDate = {};
      if (startDate) {
        matchStage.invoiceDate.$gte = startDate;
      }
      if (endDate) {
        matchStage.invoiceDate.$lte = endDate;
      }
    }

    return this.invoiceModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$serviceType',
          totalRevenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          serviceType: '$_id',
          totalRevenue: 1,
          count: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);
  }
}
