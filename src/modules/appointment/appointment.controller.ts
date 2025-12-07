import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentOutputDto } from './dto/appointment-output.dto';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../auth/schemas/user.schema';

@ApiTags('Appointments')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'appointments', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.PATIENT, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Create new appointment',
    description: 'Patient can book appointment. Doctor/Admin can create on behalf of patient.',
  })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or time conflict' })
  @ApiResponse({ status: 409, description: 'Appointment slot already booked' })
  create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser('userId') userId: string,
  ): Promise<AppointmentOutputDto> {
    return this.appointmentService.create(dto, userId);
  }

  @Get()
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List appointments with filters',
    description:
      'Get all appointments with optional filtering by patient, doctor, hospital, status, etc.',
  })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  findAll(@Query() filter: AppointmentFilterDto) {
    return this.appointmentService.findAll(filter);
  }

  @Get('upcoming/:patientId')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get upcoming appointments for a patient',
    description: 'Returns all future appointments for the specified patient',
  })
  @ApiResponse({ status: 200, description: 'Upcoming appointments retrieved' })
  getUpcomingAppointments(@Param('patientId') patientId: string): Promise<AppointmentOutputDto[]> {
    return this.appointmentService.getUpcomingAppointments(patientId);
  }

  @Get('doctor-schedule/:doctorId')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get doctor schedule for a specific date',
    description: 'Returns all appointments for a doctor on a given date',
  })
  @ApiResponse({ status: 200, description: 'Doctor schedule retrieved' })
  getDoctorSchedule(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
  ): Promise<AppointmentOutputDto[]> {
    return this.appointmentService.getDoctorSchedule(doctorId, date);
  }

  @Get(':id')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get appointment details',
    description: 'Retrieve details of a specific appointment',
  })
  @ApiResponse({ status: 200, description: 'Appointment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  findOne(@Param('id') id: string): Promise<AppointmentOutputDto> {
    return this.appointmentService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update appointment',
    description: 'Update appointment details, status, or reschedule',
  })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 400, description: 'Invalid update or time conflict' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser('userId') userId: string,
  ): Promise<AppointmentOutputDto> {
    return this.appointmentService.update(id, dto, userId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Cancel appointment',
    description: 'Cancel an appointment with a reason',
  })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  cancel(
    @Param('id') id: string,
    @Body('cancellationReason') cancellationReason: string,
    @CurrentUser('userId') userId: string,
  ): Promise<AppointmentOutputDto> {
    return this.appointmentService.cancel(id, cancellationReason, userId);
  }

  @Post(':id/check-in')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Check-in patient',
    description: 'Mark patient as checked-in for the appointment',
  })
  @ApiResponse({ status: 200, description: 'Patient checked in successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 400, description: 'Invalid appointment status for check-in' })
  checkIn(@Param('id') id: string): Promise<AppointmentOutputDto> {
    return this.appointmentService.checkIn(id);
  }

  @Post(':id/fulfill')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Mark appointment as fulfilled',
    description: 'Mark appointment as completed, optionally link to encounter',
  })
  @ApiResponse({ status: 200, description: 'Appointment marked as fulfilled' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  fulfill(
    @Param('id') id: string,
    @Body('encounterId') encounterId?: string,
  ): Promise<AppointmentOutputDto> {
    return this.appointmentService.fulfill(id, encounterId);
  }

  @Post(':id/no-show')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Mark appointment as no-show',
    description: 'Mark appointment when patient does not arrive',
  })
  @ApiResponse({ status: 200, description: 'Appointment marked as no-show' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  markNoShow(@Param('id') id: string): Promise<AppointmentOutputDto> {
    return this.appointmentService.markNoShow(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete appointment',
    description: 'Soft delete an appointment (Admin only)',
  })
  @ApiResponse({ status: 204, description: 'Appointment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.appointmentService.remove(id);
  }
}
