import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TelemedicineSession,
  TelemedicineSessionDocument,
  SessionStatus,
  SessionType,
  ParticipantStatus,
} from './schemas/telemedicine-session.schema';
import { TelemedicineSessionFilterDto } from './dto/telemedicine-session-filter.dto';

@Injectable()
export class TelemedicineSessionRepository {
  constructor(
    @InjectModel(TelemedicineSession.name)
    private sessionModel: Model<TelemedicineSessionDocument>,
  ) {}

  async create(sessionData: Partial<TelemedicineSession>): Promise<TelemedicineSessionDocument> {
    const session = new this.sessionModel(sessionData);
    return session.save();
  }

  async findById(id: string): Promise<TelemedicineSessionDocument | null> {
    return this.sessionModel
      .findOne({ _id: new Types.ObjectId(id), deletedAt: null })
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name address')
      .exec();
  }

  async findBySessionId(sessionId: string): Promise<TelemedicineSessionDocument | null> {
    return this.sessionModel
      .findOne({ sessionId, deletedAt: null })
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name address')
      .exec();
  }

  async findAll(filter: TelemedicineSessionFilterDto): Promise<{
    sessions: TelemedicineSessionDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'scheduledStartTime',
      sortOrder = 'desc',
      ...filterCriteria
    } = filter;

    const query: any = { deletedAt: null };

    // Build filter query
    if (filterCriteria.sessionId) {
      query.sessionId = filterCriteria.sessionId;
    }

    if (filterCriteria.patientId) {
      query.patientId = filterCriteria.patientId;
    }

    if (filterCriteria.doctorId) {
      query.doctorId = new Types.ObjectId(filterCriteria.doctorId);
    }

    if (filterCriteria.hospitalId) {
      query.hospitalId = new Types.ObjectId(filterCriteria.hospitalId);
    }

    if (filterCriteria.appointmentId) {
      query.appointmentId = new Types.ObjectId(filterCriteria.appointmentId);
    }

    if (filterCriteria.sessionType) {
      query.sessionType = filterCriteria.sessionType;
    }

    if (filterCriteria.status) {
      query.status = filterCriteria.status;
    }

    if (filterCriteria.startDate || filterCriteria.endDate) {
      query.scheduledStartTime = {};
      if (filterCriteria.startDate) {
        query.scheduledStartTime.$gte = filterCriteria.startDate;
      }
      if (filterCriteria.endDate) {
        query.scheduledStartTime.$lte = filterCriteria.endDate;
      }
    }

    if (filterCriteria.isUpcoming !== undefined) {
      if (filterCriteria.isUpcoming) {
        query.status = SessionStatus.SCHEDULED;
        query.scheduledStartTime = { $gt: new Date() };
      }
    }

    if (filterCriteria.isActive !== undefined) {
      if (filterCriteria.isActive) {
        query.status = { $in: [SessionStatus.WAITING, SessionStatus.IN_PROGRESS] };
      }
    }

    if (filterCriteria.hasRecording !== undefined) {
      if (filterCriteria.hasRecording) {
        query['recording.recordingUrl'] = { $exists: true, $ne: null };
      }
    }

    if (filterCriteria.isPaid !== undefined) {
      query.isPaid = filterCriteria.isPaid;
    }

    if (filterCriteria.participantUserId) {
      query['participants.userId'] = new Types.ObjectId(filterCriteria.participantUserId);
      if (filterCriteria.participantRole) {
        query['participants.role'] = filterCriteria.participantRole;
      }
    }

    if (filterCriteria.search) {
      query.$or = [
        { title: { $regex: filterCriteria.search, $options: 'i' } },
        { description: { $regex: filterCriteria.search, $options: 'i' } },
        { chiefComplaint: { $regex: filterCriteria.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [sessions, total] = await Promise.all([
      this.sessionModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('doctorId', 'name specialization')
        .populate('hospitalId', 'name address')
        .exec(),
      this.sessionModel.countDocuments(query),
    ]);

    return { sessions, total, page, limit };
  }

  async findByPatientId(patientId: string, limit = 10): Promise<TelemedicineSessionDocument[]> {
    return this.sessionModel
      .find({ patientId, deletedAt: null })
      .sort({ scheduledStartTime: -1 })
      .limit(limit)
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name address')
      .exec();
  }

  async findByDoctorId(doctorId: string, limit = 10): Promise<TelemedicineSessionDocument[]> {
    return this.sessionModel
      .find({ doctorId: new Types.ObjectId(doctorId), deletedAt: null })
      .sort({ scheduledStartTime: -1 })
      .limit(limit)
      .populate('hospitalId', 'name address')
      .exec();
  }

  async findByHospitalId(hospitalId: string, limit = 10): Promise<TelemedicineSessionDocument[]> {
    return this.sessionModel
      .find({ hospitalId: new Types.ObjectId(hospitalId), deletedAt: null })
      .sort({ scheduledStartTime: -1 })
      .limit(limit)
      .populate('doctorId', 'name specialization')
      .exec();
  }

  async findUpcoming(limit = 10): Promise<TelemedicineSessionDocument[]> {
    return this.sessionModel
      .find({
        status: SessionStatus.SCHEDULED,
        scheduledStartTime: { $gt: new Date() },
        deletedAt: null,
      })
      .sort({ scheduledStartTime: 1 })
      .limit(limit)
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name address')
      .exec();
  }

  async findActive(limit = 10): Promise<TelemedicineSessionDocument[]> {
    return this.sessionModel
      .find({
        status: { $in: [SessionStatus.WAITING, SessionStatus.IN_PROGRESS] },
        deletedAt: null,
      })
      .sort({ actualStartTime: -1 })
      .limit(limit)
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name address')
      .exec();
  }

  async update(
    id: string,
    updateData: Partial<TelemedicineSession>,
  ): Promise<TelemedicineSessionDocument | null> {
    return this.sessionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $set: updateData },
        { new: true },
      )
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name address')
      .exec();
  }

  async updateStatus(
    id: string,
    status: SessionStatus,
  ): Promise<TelemedicineSessionDocument | null> {
    const updateData: any = { status };

    if (status === SessionStatus.IN_PROGRESS && !updateData.actualStartTime) {
      updateData.actualStartTime = new Date();
    }

    if (status === SessionStatus.COMPLETED && !updateData.actualEndTime) {
      updateData.actualEndTime = new Date();
    }

    return this.update(id, updateData);
  }

  async addParticipant(
    sessionId: string,
    participantData: any,
  ): Promise<TelemedicineSessionDocument | null> {
    return this.sessionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(sessionId), deletedAt: null },
        { $push: { participants: participantData } },
        { new: true },
      )
      .exec();
  }

  async updateParticipantStatus(
    sessionId: string,
    userId: string,
    status?: ParticipantStatus,
    additionalData?: any,
  ): Promise<TelemedicineSessionDocument | null> {
    const updateData: Record<string, any> = {};

    if (status) {
      updateData['participants.$.status'] = status;

      if (status === ParticipantStatus.JOINED) {
        updateData['participants.$.joinedAt'] = new Date();
      }

      if (status === ParticipantStatus.LEFT || status === ParticipantStatus.DISCONNECTED) {
        updateData['participants.$.leftAt'] = new Date();
      }
    }

    if (additionalData) {
      Object.keys(additionalData).forEach((key) => {
        updateData[`participants.$.${key}`] = additionalData[key];
      });
    }

    return this.sessionModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(sessionId),
          'participants.userId': new Types.ObjectId(userId),
          deletedAt: null,
        },
        { $set: updateData },
        { new: true },
      )
      .exec();
  }

  async addChatMessage(
    sessionId: string,
    message: any,
  ): Promise<TelemedicineSessionDocument | null> {
    return this.sessionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(sessionId), deletedAt: null },
        {
          $push: { chatHistory: message },
          $inc: { 'metrics.chatMessageCount': 1 },
        },
        { new: true },
      )
      .exec();
  }

  async updateRecording(
    sessionId: string,
    recordingData: any,
  ): Promise<TelemedicineSessionDocument | null> {
    return this.sessionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(sessionId), deletedAt: null },
        { $set: { recording: recordingData } },
        { new: true },
      )
      .exec();
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.sessionModel
      .updateOne(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $set: { deletedAt: new Date() } },
      )
      .exec();

    return result.modifiedCount > 0;
  }

  async getStatistics(filter?: any): Promise<any> {
    const query: any = { deletedAt: null };

    if (filter?.patientId) {
      query.patientId = filter.patientId;
    }

    if (filter?.doctorId) {
      query.doctorId = new Types.ObjectId(filter.doctorId);
    }

    if (filter?.hospitalId) {
      query.hospitalId = new Types.ObjectId(filter.hospitalId);
    }

    if (filter?.startDate || filter?.endDate) {
      query.scheduledStartTime = {};
      if (filter.startDate) {
        query.scheduledStartTime.$gte = filter.startDate;
      }
      if (filter.endDate) {
        query.scheduledStartTime.$lte = filter.endDate;
      }
    }

    const stats = await this.sessionModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          scheduled: {
            $sum: { $cond: [{ $eq: ['$status', SessionStatus.SCHEDULED] }, 1, 0] },
          },
          waiting: {
            $sum: { $cond: [{ $eq: ['$status', SessionStatus.WAITING] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', SessionStatus.IN_PROGRESS] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', SessionStatus.COMPLETED] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', SessionStatus.CANCELLED] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', SessionStatus.FAILED] }, 1, 0] },
          },
          noShow: {
            $sum: { $cond: [{ $eq: ['$status', SessionStatus.NO_SHOW] }, 1, 0] },
          },
          totalDuration: { $sum: '$metrics.totalDuration' },
          totalRevenue: { $sum: { $cond: ['$isPaid', '$consultationFee', 0] } },
        },
      },
    ]);

    const typeStats = await this.sessionModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$sessionType',
          count: { $sum: 1 },
        },
      },
    ]);

    const byType: Record<SessionType, number> = {
      [SessionType.VIDEO]: 0,
      [SessionType.AUDIO]: 0,
      [SessionType.CHAT]: 0,
    };

    typeStats.forEach((item) => {
      byType[item._id as SessionType] = item.count;
    });

    const result = stats[0] || {
      total: 0,
      scheduled: 0,
      waiting: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      failed: 0,
      noShow: 0,
      totalDuration: 0,
      totalRevenue: 0,
    };

    return {
      ...result,
      byType,
      averageDuration:
        result.completed > 0 ? Math.floor(result.totalDuration / result.completed / 60) : 0,
      totalDuration: Math.floor(result.totalDuration / 60), // Convert to minutes
    };
  }

  async findSessionsNeedingReminder(minutesBefore = 15): Promise<TelemedicineSessionDocument[]> {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + minutesBefore * 60000);

    return this.sessionModel
      .find({
        status: SessionStatus.SCHEDULED,
        scheduledStartTime: {
          $gte: now,
          $lte: reminderTime,
        },
        reminderSent: { $ne: true },
        deletedAt: null,
      })
      .populate('doctorId', 'name email phone')
      .exec();
  }
}
