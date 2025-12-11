import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, FilterQuery, Connection } from 'mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { BaseRepository } from '../../../common/base.repository';

export interface PaymentStatistics {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  refundedAmount: number;
  averagePaymentAmount: number;
  byMethod: {
    credit_card: number;
    debit_card: number;
    upi: number;
    net_banking: number;
    wallet: number;
    cash: number;
    insurance: number;
  };
  byGateway: {
    razorpay: number;
    stripe: number;
    paytm: number;
    phonepe: number;
    cash: number;
  };
}

@Injectable()
export class PaymentRepository extends BaseRepository<PaymentDocument> {
  protected readonly logger = new Logger(PaymentRepository.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(paymentModel, connection);
  }

  /**
   * Find payment by payment number
   */
  async findByPaymentNumber(paymentNumber: string): Promise<PaymentDocument | null> {
    return this.paymentModel
      .findOne({ paymentNumber, deletedAt: null })
      .populate('invoiceId')
      .populate('patientId', 'name email phone')
      .exec();
  }

  /**
   * Find payments by invoice
   */
  async findByInvoice(invoiceId: string): Promise<PaymentDocument[]> {
    return this.paymentModel.find({ invoiceId, deletedAt: null }).sort({ paymentDate: -1 }).exec();
  }

  /**
   * Find all payments with advanced filtering
   */
  async findAllWithFilters(filters: {
    page?: number;
    limit?: number;
    patientId?: string;
    hospitalId?: string;
    invoiceId?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    paymentGateway?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<{
    payments: PaymentDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      patientId,
      hospitalId,
      paymentStatus,
      paymentMethod,
      paymentGateway,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
    } = filters;

    const query: FilterQuery<Payment> = { deletedAt: null };

    // Entity filters
    if (patientId) {
      query.patientId = patientId;
    }
    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    // Status filter
    if (paymentStatus) {
      if (paymentStatus === 'unpaid') {
        query.status = 'pending';
      } else if (paymentStatus === 'paid') {
        query.status = 'completed';
      } else {
        query.status = paymentStatus;
      }
    }

    // Payment method and gateway filters
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    if (paymentGateway) {
      query.paymentGateway = paymentGateway;
    }

    // Date range filter
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        query.paymentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.paymentDate.$lte = new Date(endDate);
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) {
        query.amount.$gte = minAmount;
      }
      if (maxAmount) {
        query.amount.$lte = maxAmount;
      }
    }

    // Search filter (payment number or transaction ID)
    if (search) {
      query.$or = [
        { paymentNumber: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { 'gatewayResponse.razorpay_payment_id': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.paymentModel
        .find(query)
        .populate('invoiceId', 'invoiceNumber totalAmount')
        .populate('patientId', 'name email phone')
        .populate('hospitalId', 'name')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(query),
    ]);

    return { payments, total, page, limit };
  }

  /**
   * Update payment status
   */
  async updateStatus(
    paymentId: string,
    status: string,
    errorMessage?: string,
  ): Promise<PaymentDocument | null> {
    const updateData: Record<string, any> = { status };

    if (status === 'completed') {
      updateData.completedAt = new Date();
    } else if (status === 'failed' && errorMessage) {
      updateData.failureReason = errorMessage;
    }

    return this.paymentModel.findByIdAndUpdate(paymentId, updateData, { new: true }).exec();
  }

  /**
   * Process refund
   */
  async processRefund(
    paymentId: string,
    refundAmount: number,
    refundId: string,
    reason: string,
  ): Promise<PaymentDocument | null> {
    return this.paymentModel
      .findByIdAndUpdate(
        paymentId,
        {
          refundAmount,
          refundId,
          refundReason: reason,
          refundedAt: new Date(),
          status: 'refunded',
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Update gateway response
   */
  async updateGatewayResponse(
    paymentId: string,
    gatewayResponse: Record<string, unknown>,
  ): Promise<PaymentDocument | null> {
    return this.paymentModel
      .findByIdAndUpdate(paymentId, { gatewayResponse }, { new: true })
      .exec();
  }

  /**
   * Find pending payments
   */
  async findPendingPayments(hospitalId?: string): Promise<PaymentDocument[]> {
    const query: FilterQuery<Payment> = {
      status: 'pending',
      deletedAt: null,
    };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    return this.paymentModel
      .find(query)
      .populate('invoiceId', 'invoiceNumber totalAmount')
      .populate('patientId', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find failed payments
   */
  async findFailedPayments(patientId?: string, startDate?: Date): Promise<Payment[]> {
    const query: FilterQuery<Payment> = {
      status: 'failed',
      deletedAt: null,
    };

    if (patientId) {
      query.patientId = patientId;
    }

    if (startDate) {
      query.createdAt = { $gte: startDate };
    }

    return this.paymentModel
      .find(query)
      .populate('invoiceId', 'invoiceNumber totalAmount')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get payments by patient
   */
  async findByPatient(patientId: string, limit: number = 10): Promise<PaymentDocument[]> {
    return this.paymentModel
      .find({ patientId, deletedAt: null })
      .populate('invoiceId', 'invoiceNumber totalAmount serviceType')
      .populate('hospitalId', 'name')
      .sort({ paymentDate: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get payments by hospital
   */
  async findByHospital(
    hospitalId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PaymentDocument[]> {
    const query: FilterQuery<Payment> = {
      hospitalId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        query.paymentDate.$gte = startDate;
      }
      if (endDate) {
        query.paymentDate.$lte = endDate;
      }
    }

    return this.paymentModel
      .find(query)
      .populate('invoiceId', 'invoiceNumber totalAmount')
      .populate('patientId', 'name')
      .sort({ paymentDate: -1 })
      .exec();
  }

  /**
   * Get payment statistics
   */
  async getStatistics(
    hospitalId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PaymentStatistics> {
    const query: FilterQuery<Payment> = { deletedAt: null };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        query.paymentDate.$gte = startDate;
      }
      if (endDate) {
        query.paymentDate.$lte = endDate;
      }
    }

    const payments = await this.paymentModel.find(query).exec();

    const stats: PaymentStatistics = {
      totalPayments: payments.length,
      totalAmount: 0,
      successfulPayments: 0,
      failedPayments: 0,
      pendingPayments: 0,
      refundedAmount: 0,
      averagePaymentAmount: 0,
      byMethod: {
        credit_card: 0,
        debit_card: 0,
        upi: 0,
        net_banking: 0,
        wallet: 0,
        cash: 0,
        insurance: 0,
      },
      byGateway: {
        razorpay: 0,
        stripe: 0,
        paytm: 0,
        phonepe: 0,
        cash: 0,
      },
    };

    payments.forEach((payment) => {
      stats.totalAmount += payment.amount;

      if (payment.status === 'completed') {
        stats.successfulPayments++;
      } else if (payment.status === 'failed') {
        stats.failedPayments++;
      } else if (payment.status === 'pending') {
        stats.pendingPayments++;
      }

      if (payment.refundAmount) {
        stats.refundedAmount += payment.refundAmount;
      }

      // Count by method
      const methodKey = payment.paymentMethod.replace('-', '_') as keyof typeof stats.byMethod;
      if (stats.byMethod[methodKey] !== undefined) {
        stats.byMethod[methodKey]++;
      }

      // Count by gateway
      const gatewayKey = payment.paymentGateway as keyof typeof stats.byGateway;
      if (stats.byGateway[gatewayKey] !== undefined) {
        stats.byGateway[gatewayKey]++;
      }
    });

    stats.averagePaymentAmount =
      stats.totalPayments > 0 ? stats.totalAmount / stats.totalPayments : 0;

    return stats;
  }

  /**
   * Get revenue by payment method
   */
  async getRevenueByPaymentMethod(
    hospitalId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ paymentMethod: string; totalRevenue: number; count: number }[]> {
    const matchStage: FilterQuery<Payment> = { deletedAt: null, status: 'completed' };

    if (hospitalId) {
      matchStage.hospitalId = hospitalId;
    }
    if (startDate || endDate) {
      matchStage.paymentDate = {};
      if (startDate) {
        matchStage.paymentDate.$gte = startDate;
      }
      if (endDate) {
        matchStage.paymentDate.$lte = endDate;
      }
    }

    return this.paymentModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          paymentMethod: '$_id',
          totalRevenue: 1,
          count: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);
  }

  /**
   * Get daily revenue summary
   */
  async getDailyRevenue(
    hospitalId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ date: string; revenue: number; count: number }[]> {
    const matchStage: FilterQuery<Payment> = { deletedAt: null, status: 'completed' };

    if (hospitalId) {
      matchStage.hospitalId = hospitalId;
    }
    if (startDate || endDate) {
      matchStage.paymentDate = {};
      if (startDate) {
        matchStage.paymentDate.$gte = startDate;
      }
      if (endDate) {
        matchStage.paymentDate.$lte = endDate;
      }
    }

    return this.paymentModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' },
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          revenue: 1,
          count: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);
  }

  /**
   * Find payments by Razorpay order ID
   */
  async findByRazorpayOrderId(orderId: string): Promise<PaymentDocument | null> {
    return this.paymentModel
      .findOne({
        'gatewayResponse.razorpay_order_id': orderId,
        deletedAt: null,
      })
      .exec();
  }

  /**
   * Find payments by transaction ID
   */
  async findByTransactionId(transactionId: string): Promise<PaymentDocument | null> {
    return this.paymentModel
      .findOne({ transactionId, deletedAt: null })
      .populate('invoiceId')
      .populate('patientId', 'name email')
      .exec();
  }
}
