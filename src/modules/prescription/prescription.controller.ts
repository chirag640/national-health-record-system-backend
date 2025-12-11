import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionFilterDto } from './dto/prescription-filter.dto';
import { PrescriptionOutputDto, PrescriptionListOutputDto } from './dto/prescription-output.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserPayload } from '../../common/interfaces/user-payload.interface';
import { UserRole } from '../../auth/schemas/user.schema';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'prescriptions', version: '1' })
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new prescription' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Prescription created successfully',
    type: PrescriptionOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  async create(
    @Body() createPrescriptionDto: CreatePrescriptionDto,
    @CurrentUser() user: UserPayload,
  ): Promise<any> {
    return this.prescriptionService.create(createPrescriptionDto, user.userId);
  }

  @Get()
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get all prescriptions with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescriptions retrieved successfully',
    type: PrescriptionListOutputDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findAll(
    @Query() filters: PrescriptionFilterDto,
    @CurrentUser() user: UserPayload,
  ): Promise<any> {
    // If user is a patient, filter to their own prescriptions
    if (user.role === UserRole.PATIENT) {
      filters.patient = user.patientId;
    }

    // If user is a doctor, optionally filter to their prescriptions
    if (user.role === UserRole.DOCTOR && !filters.prescriber) {
      // Optionally enforce: filters.prescriber = user.doctorId;
    }

    return this.prescriptionService.findAll(filters);
  }

  @Get('patient/:patientId/active')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get active prescriptions for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active prescriptions retrieved',
    type: [PrescriptionOutputDto],
  })
  async getActiveForPatient(
    @Param('patientId') patientId: string,
    @CurrentUser() user: UserPayload,
  ) {
    // Authorization: patients can only view their own
    if (user.role === UserRole.PATIENT && user.patientId !== patientId) {
      throw new Error('Forbidden');
    }

    return this.prescriptionService.getActiveForPatient(patientId);
  }

  @Get('patient/:patientId/needing-refill')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get prescriptions needing refill for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescriptions needing refill',
    type: [PrescriptionOutputDto],
  })
  async getNeedingRefill(@Param('patientId') patientId: string, @CurrentUser() user: UserPayload) {
    if (user.role === UserRole.PATIENT && user.patientId !== patientId) {
      throw new Error('Forbidden');
    }

    return this.prescriptionService.getNeedingRefill(patientId);
  }

  @Get('patient/:patientId/stats')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get prescription statistics for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescription statistics retrieved',
  })
  async getPatientStats(@Param('patientId') patientId: string, @CurrentUser() user: UserPayload) {
    if (user.role === UserRole.PATIENT && user.patientId !== patientId) {
      throw new Error('Forbidden');
    }

    return this.prescriptionService.getPatientStats(patientId);
  }

  @Get('encounter/:encounterId')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get prescriptions for an encounter' })
  @ApiParam({ name: 'encounterId', description: 'Encounter MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Encounter prescriptions retrieved',
    type: [PrescriptionOutputDto],
  })
  async getByEncounter(@Param('encounterId') encounterId: string) {
    return this.prescriptionService.getByEncounter(encounterId);
  }

  @Get('expiring')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get prescriptions expiring soon' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Days ahead to check (default: 7)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expiring prescriptions retrieved',
    type: [PrescriptionOutputDto],
  })
  async getExpiring(@Query('days') days?: number) {
    return this.prescriptionService.getExpiringPrescriptions(days || 7);
  }

  @Get('search')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Search prescriptions by medication name' })
  @ApiQuery({ name: 'q', description: 'Search term' })
  @ApiQuery({ name: 'limit', required: false, description: 'Result limit (default: 20)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results',
    type: [PrescriptionOutputDto],
  })
  async searchByMedication(@Query('q') searchTerm: string, @Query('limit') limit?: number) {
    return this.prescriptionService.searchByMedication(searchTerm, limit);
  }

  @Get('number/:prescriptionNumber')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get prescription by prescription number' })
  @ApiParam({
    name: 'prescriptionNumber',
    description: 'Unique prescription number (RX-YYYY-NNNNNN)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescription found',
    type: PrescriptionOutputDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Prescription not found' })
  async findByPrescriptionNumber(@Param('prescriptionNumber') prescriptionNumber: string) {
    return this.prescriptionService.findByPrescriptionNumber(prescriptionNumber);
  }

  @Get(':id')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get prescription by ID' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescription found',
    type: PrescriptionOutputDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Prescription not found' })
  async findOne(@Param('id') id: string) {
    return this.prescriptionService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a prescription' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescription updated successfully',
    type: PrescriptionOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid update' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Prescription not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePrescriptionDto: UpdatePrescriptionDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.prescriptionService.update(id, updatePrescriptionDto, user.userId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a prescription' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescription cancelled',
    type: PrescriptionOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot cancel' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.prescriptionService.cancel(id, reason, user.userId);
  }

  @Post(':id/stop')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop a prescription (therapeutic reasons)' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescription stopped',
    type: PrescriptionOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot stop' })
  async stop(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.prescriptionService.stop(id, reason, user.userId);
  }

  @Post(':id/dispense')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark prescription as dispensed' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescription marked as dispensed',
    type: PrescriptionOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot dispense' })
  async markDispensed(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.prescriptionService.markDispensed(id, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a prescription (soft delete)' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Prescription deleted' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot delete' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Prescription not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.prescriptionService.remove(id, user.userId);
  }
}
