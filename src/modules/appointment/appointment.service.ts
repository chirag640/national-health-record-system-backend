import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AppointmentRepository } from './appointment.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentOutputDto } from './dto/appointment-output.dto';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { PaginatedResponse, createPaginatedResponse } from '../../pagination.dto';
import { AppointmentStatus, ParticipantStatus } from './schemas/appointment.schema';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  /**
   * Create a new appointment with validation
   */
  async create(dto: CreateAppointmentDto, _userId?: string): Promise<AppointmentOutputDto> {
    // Validate appointment date is in the future
    const appointmentDateTime = this.combineDateAndTime(dto.appointmentDate, dto.startTime);
    const now = new Date();

    if (appointmentDateTime < now) {
      throw new BadRequestException('Appointment date and time must be in the future');
    }

    // Validate end time is after start time
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Calculate duration
    const durationMinutes = this.calculateDuration(dto.startTime, dto.endTime);

    // Check for conflicting appointments
    const conflicts = await this.appointmentRepository.findConflictingAppointments(
      dto.doctorId,
      new Date(dto.appointmentDate),
      dto.startTime,
      dto.endTime,
    );

    if (conflicts.length > 0) {
      const conflict = conflicts[0] as any;
      throw new ConflictException(
        `Doctor already has an appointment during this time slot. Conflicting appointment ID: ${conflict._id}`,
      );
    }

    // Create appointment
    const appointment = await this.appointmentRepository.create({
      ...dto,
      patientId: dto.patientId,
      doctorId: new Types.ObjectId(dto.doctorId),
      hospitalId: new Types.ObjectId(dto.hospitalId),
      appointmentDate: new Date(dto.appointmentDate),
      durationMinutes,
      status: AppointmentStatus.PROPOSED,
      doctorStatus: ParticipantStatus.NEEDS_ACTION,
    });

    const appointmentAny = appointment as any;
    this.logger.log(`Appointment created: ${appointmentAny._id} for patient ${dto.patientId}`);

    return this.mapToOutput(appointment);
  }

  /**
   * Find all appointments with pagination and filters
   */
  async findAll(filter: AppointmentFilterDto): Promise<PaginatedResponse<AppointmentOutputDto>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (filter.patientId) {
      query.patientId = filter.patientId;
    }

    if (filter.doctorId) {
      query.doctorId = filter.doctorId;
    }

    if (filter.hospitalId) {
      query.hospitalId = filter.hospitalId;
    }

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.appointmentType) {
      query.appointmentType = filter.appointmentType;
    }

    if (filter.startDate || filter.endDate) {
      query.appointmentDate = {};
      if (filter.startDate) {
        query.appointmentDate.$gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        query.appointmentDate.$lte = new Date(filter.endDate);
      }
    }

    const [appointments, total] = await Promise.all([
      this.appointmentRepository.findAll(skip, limit),
      this.appointmentRepository.count(),
    ]);

    return createPaginatedResponse(
      appointments.map((apt) => this.mapToOutput(apt)),
      total,
      page,
      limit,
    );
  }

  /**
   * Find appointment by ID
   */
  async findOne(id: string): Promise<AppointmentOutputDto> {
    const appointment = await this.appointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return this.mapToOutput(appointment);
  }

  /**
   * Update appointment with business rules
   */
  async update(
    id: string,
    dto: UpdateAppointmentDto,
    userId?: string,
  ): Promise<AppointmentOutputDto> {
    const appointment = await this.appointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    // Prevent updating past appointments
    const appointmentDateTime = this.combineDateAndTime(
      appointment.appointmentDate.toISOString(),
      appointment.startTime,
    );
    const now = new Date();

    if (appointmentDateTime < now && dto.status !== AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot update past appointments');
    }

    // If cancelling, require cancellation reason
    if (dto.status === AppointmentStatus.CANCELLED && !dto.cancellationReason) {
      throw new BadRequestException('Cancellation reason is required when cancelling appointment');
    }

    // If rescheduling, check for conflicts
    if (dto.appointmentDate || dto.startTime || dto.endTime) {
      const newDate = dto.appointmentDate
        ? new Date(dto.appointmentDate)
        : appointment.appointmentDate;
      const newStartTime = dto.startTime || appointment.startTime;
      const newEndTime = dto.endTime || appointment.endTime;

      const conflicts = await this.appointmentRepository.findConflictingAppointments(
        appointment.doctorId.toString(),
        newDate,
        newStartTime,
        newEndTime,
        id,
      );

      if (conflicts.length > 0) {
        throw new ConflictException('Doctor already has an appointment during this time slot');
      }
    }

    // Prepare update data
    const updateData: any = { ...dto };

    if (dto.status === AppointmentStatus.CANCELLED) {
      updateData.cancellationDate = new Date();
      if (userId) {
        updateData.cancelledBy = new Types.ObjectId(userId);
      }
    }

    if (dto.startTime && dto.endTime) {
      updateData.durationMinutes = this.calculateDuration(dto.startTime, dto.endTime);
    }

    const updated = await this.appointmentRepository.update(id, updateData);

    this.logger.log(`Appointment updated: ${id}`);

    return this.mapToOutput(updated!);
  }

  /**
   * Cancel appointment
   */
  async cancel(
    id: string,
    cancellationReason: string,
    userId?: string,
  ): Promise<AppointmentOutputDto> {
    return this.update(
      id,
      {
        status: AppointmentStatus.CANCELLED,
        cancellationReason,
      },
      userId,
    );
  }

  /**
   * Check-in patient
   */
  async checkIn(id: string): Promise<AppointmentOutputDto> {
    const appointment = await this.appointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    if (appointment.status !== AppointmentStatus.BOOKED) {
      throw new BadRequestException('Only booked appointments can be checked in');
    }

    const updated = await this.appointmentRepository.update(id, {
      status: AppointmentStatus.CHECKED_IN,
      checkInTime: new Date(),
    });

    this.logger.log(`Patient checked in for appointment: ${id}`);

    return this.mapToOutput(updated!);
  }

  /**
   * Mark appointment as fulfilled (completed)
   */
  async fulfill(id: string, encounterId?: string): Promise<AppointmentOutputDto> {
    const appointment = await this.appointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    const updateData: any = {
      status: AppointmentStatus.FULFILLED,
      checkOutTime: new Date(),
    };

    if (encounterId) {
      updateData.encounterId = new Types.ObjectId(encounterId);
    }

    const updated = await this.appointmentRepository.update(id, updateData);

    this.logger.log(`Appointment fulfilled: ${id}`);

    return this.mapToOutput(updated!);
  }

  /**
   * Mark appointment as no-show
   */
  async markNoShow(id: string): Promise<AppointmentOutputDto> {
    return this.update(id, { status: AppointmentStatus.NO_SHOW });
  }

  /**
   * Get upcoming appointments for a patient
   */
  async getUpcomingAppointments(patientId: string): Promise<AppointmentOutputDto[]> {
    const appointments = await this.appointmentRepository.findUpcomingAppointments(patientId, 30);
    return appointments.map((apt) => this.mapToOutput(apt));
  }

  /**
   * Get doctor's schedule for a specific date
   */
  async getDoctorSchedule(doctorId: string, date: string): Promise<AppointmentOutputDto[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const appointments = await this.appointmentRepository.findByDateRange(
      startDate,
      endDate,
      0,
      100,
    );

    return appointments
      .filter((apt) => apt.doctorId.toString() === doctorId)
      .map((apt) => this.mapToOutput(apt));
  }

  /**
   * Delete appointment (soft delete)
   */
  async remove(id: string): Promise<void> {
    const appointment = await this.appointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    await this.appointmentRepository.delete(id);
    this.logger.log(`Appointment deleted: ${id}`);
  }

  /**
   * Helper: Combine date and time strings
   */
  private combineDateAndTime(dateStr: string, timeStr: string): Date {
    const date = new Date(dateStr);
    const timeParts = timeStr.split(':').map(Number);
    const hours: number = timeParts[0] ?? 0;
    const minutes: number = timeParts[1] ?? 0;
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Helper: Calculate duration between two times
   */
  private calculateDuration(startTime: string, endTime: string): number {
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    const startHours: number = startParts[0] ?? 0;
    const startMinutes: number = startParts[1] ?? 0;
    const endHours: number = endParts[0] ?? 0;
    const endMinutes: number = endParts[1] ?? 0;
    return (endHours - startHours) * 60 + (endMinutes - startMinutes);
  }

  /**
   * Map database model to output DTO
   */
  private mapToOutput(item: any): AppointmentOutputDto {
    return {
      id: item._id.toString(),
      patientId: item.patientId,
      doctorId: item.doctorId?.toString(),
      hospitalId: item.hospitalId?.toString(),
      status: item.status,
      appointmentType: item.appointmentType,
      priority: item.priority,
      appointmentDate: item.appointmentDate,
      startTime: item.startTime,
      endTime: item.endTime,
      durationMinutes: item.durationMinutes,
      reasonForVisit: item.reasonForVisit,
      symptoms: item.symptoms,
      notes: item.notes,
      patientInstructions: item.patientInstructions,
      cancellationReason: item.cancellationReason,
      cancellationDate: item.cancellationDate,
      cancelledBy: item.cancelledBy?.toString(),
      checkInTime: item.checkInTime,
      checkOutTime: item.checkOutTime,
      doctorStatus: item.doctorStatus,
      reminderSent: item.reminderSent,
      reminderSentAt: item.reminderSentAt,
      encounterId: item.encounterId?.toString(),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
