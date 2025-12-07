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

  async create(data: Partial<Appointment>): Promise<Appointment> {
    const created = new this.appointmentModel(data);
    const saved = await created.save();
    return saved.toObject() as Appointment;
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<Appointment[]> {
    return this.appointmentModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ appointmentDate: -1, startTime: -1 })
      .lean()
      .exec() as Promise<Appointment[]>;
  }

  async findById(id: string): Promise<Appointment | null> {
    return this.appointmentModel.findById(id).lean().exec() as Promise<Appointment | null>;
  }

  async update(id: string, data: Partial<Appointment>): Promise<Appointment | null> {
    return this.appointmentModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean()
      .exec() as Promise<Appointment | null>;
  }

  async delete(id: string): Promise<Appointment | null> {
    return this.appointmentModel.findByIdAndDelete(id).lean().exec() as Promise<Appointment | null>;
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
      .lean()
      .exec() as Promise<Appointment[]>;
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
      .lean()
      .exec() as Promise<Appointment[]>;
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
      .lean()
      .exec() as Promise<Appointment[]>;
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
      .lean()
      .exec() as Promise<Appointment[]>;
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

    return this.appointmentModel.find(query).lean().exec() as Promise<Appointment[]>;
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
      .lean()
      .exec() as Promise<Appointment[]>;
  }
}
