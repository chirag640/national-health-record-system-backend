import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { BaseRepository } from '../../common/base.repository';

@Injectable()
export class AppointmentRepository extends BaseRepository<AppointmentDocument> {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(appointmentModel, connection);
  }

  async create(data: Partial<AppointmentDocument>): Promise<AppointmentDocument> {
    const created = new this.appointmentModel(data);
    return await created.save();
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<AppointmentDocument[]> {
    return this.appointmentModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ appointmentDate: -1, startTime: -1 })
      .exec();
  }

  async findById(id: string): Promise<AppointmentDocument | null> {
    return this.appointmentModel.findById(id).exec();
  }

  async update(
    id: string,
    data: Partial<AppointmentDocument>,
  ): Promise<AppointmentDocument | null> {
    return this.appointmentModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.appointmentModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async count(): Promise<number> {
    return this.appointmentModel.countDocuments().exec();
  }

  /**
   * Find appointments by patient ID
   */
  async findByPatientId(
    patientId: string,
    skip: number = 0,
    limit: number = 10,
  ): Promise<Appointment[]> {
    return this.appointmentModel
      .find({ patientId })
      .skip(skip)
      .limit(limit)
      .sort({ appointmentDate: -1, startTime: -1 })
      .exec();
  }

  /**
   * Find appointments by doctor ID
   */
  async findByDoctorId(
    doctorId: string,
    skip: number = 0,
    limit: number = 10,
  ): Promise<Appointment[]> {
    return this.appointmentModel
      .find({ doctorId })
      .skip(skip)
      .limit(limit)
      .sort({ appointmentDate: 1, startTime: 1 })
      .exec();
  }

  /**
   * Find appointments by hospital ID
   */
  async findByHospitalId(
    hospitalId: string,
    skip: number = 0,
    limit: number = 10,
  ): Promise<Appointment[]> {
    return this.appointmentModel
      .find({ hospitalId })
      .skip(skip)
      .limit(limit)
      .sort({ appointmentDate: -1, startTime: -1 })
      .exec();
  }

  /**
   * Find appointments by date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    skip: number = 0,
    limit: number = 10,
  ): Promise<Appointment[]> {
    return this.appointmentModel
      .find({
        appointmentDate: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .skip(skip)
      .limit(limit)
      .sort({ appointmentDate: 1, startTime: 1 })
      .exec();
  }

  /**
   * Check for conflicting appointments
   */
  async findConflictingAppointments(
    doctorId: string,
    appointmentDate: Date,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string,
  ): Promise<Appointment[]> {
    const query: any = {
      doctorId,
      appointmentDate,
      status: { $nin: ['cancelled', 'noshow', 'entered-in-error'] },
      $or: [
        // New appointment starts during existing appointment
        {
          startTime: { $lte: startTime },
          endTime: { $gt: startTime },
        },
        // New appointment ends during existing appointment
        {
          startTime: { $lt: endTime },
          endTime: { $gte: endTime },
        },
        // New appointment completely contains existing appointment
        {
          startTime: { $gte: startTime },
          endTime: { $lte: endTime },
        },
      ],
    };

    if (excludeAppointmentId) {
      query._id = { $ne: excludeAppointmentId };
    }

    return this.appointmentModel.find(query).exec();
  }

  /**
   * Count appointments by status
   */
  async countByStatus(status: string): Promise<number> {
    return this.appointmentModel.countDocuments({ status }).exec();
  }

  /**
   * Find upcoming appointments (next 7 days)
   */
  async findUpcomingAppointments(patientId: string, days: number = 7): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    return this.appointmentModel
      .find({
        patientId,
        appointmentDate: {
          $gte: today,
          $lte: futureDate,
        },
        status: { $nin: ['cancelled', 'noshow', 'fulfilled'] },
      })
      .sort({ appointmentDate: 1, startTime: 1 })
      .exec();
  }
}
