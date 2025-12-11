import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TelemedicineSessionService } from './telemedicine-session.service';
import {
  CreateTelemedicineSessionDto,
  UpdateTelemedicineSessionDto,
  AddClinicalNotesDto,
  RecordingConsentDto,
} from './dto';
import { TelemedicineSessionFilterDto } from './dto/telemedicine-session-filter.dto';
import {
  TelemedicineSessionOutputDto,
  PaginatedTelemedicineSessionsDto,
  SessionStatsDto,
  JoinSessionResponseDto,
} from './dto/telemedicine-session-output.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/schemas/user.schema';

@ApiTags('Telemedicine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('telemedicine')
export class TelemedicineSessionController {
  constructor(private readonly sessionService: TelemedicineSessionService) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Create a new telemedicine session',
    description: 'Create and schedule a video consultation session between doctor and patient',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Session created successfully',
    type: TelemedicineSessionOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  async create(
    @Body() createDto: CreateTelemedicineSessionDto,
  ): Promise<TelemedicineSessionOutputDto> {
    return this.sessionService.create(createDto);
  }

  @Get()
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Get all telemedicine sessions with filtering',
    description:
      'Retrieve paginated list of sessions with optional filters (patient, doctor, status, date range)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sessions retrieved successfully',
    type: PaginatedTelemedicineSessionsDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findAll(
    @Query() filter: TelemedicineSessionFilterDto,
  ): Promise<PaginatedTelemedicineSessionsDto> {
    return this.sessionService.findAll(filter);
  }

  @Get('upcoming')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Get upcoming scheduled sessions',
    description: 'Retrieve future/scheduled telemedicine sessions',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of sessions to retrieve (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upcoming sessions retrieved successfully',
    type: PaginatedTelemedicineSessionsDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findUpcoming(@Query('limit') limit = 10): Promise<PaginatedTelemedicineSessionsDto> {
    return this.sessionService.findAll({ isUpcoming: true, limit } as any);
  }

  @Get('active')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Get active (in-progress) sessions',
    description: 'Retrieve currently ongoing telemedicine sessions',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of sessions to retrieve (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active sessions retrieved successfully',
    type: PaginatedTelemedicineSessionsDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findActive(@Query('limit') limit = 10): Promise<PaginatedTelemedicineSessionsDto> {
    return this.sessionService.findAll({ isActive: true, limit } as any);
  }

  @Get('stats')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Get session statistics',
    description:
      'Retrieve aggregated statistics for telemedicine sessions (total, completed, cancelled, avg duration)',
  })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filter by patient ID' })
  @ApiQuery({ name: 'doctorId', required: false, description: 'Filter by doctor ID' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: SessionStatsDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  async getStatistics(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('hospitalId') hospitalId?: string,
  ): Promise<SessionStatsDto> {
    return this.sessionService.getStatistics({ patientId, doctorId, hospitalId });
  }

  @Get(':id')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Get session details by ID',
    description: 'Retrieve complete details of a specific telemedicine session',
  })
  @ApiParam({ name: 'id', description: 'Telemedicine session MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session retrieved successfully',
    type: TelemedicineSessionOutputDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Session not found' })
  async findById(@Param('id') id: string): Promise<TelemedicineSessionOutputDto> {
    return this.sessionService.findById(id);
  }

  @Get('session-id/:sessionId')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Get session by video room session ID',
    description: 'Retrieve session details using Twilio/video room session identifier',
  })
  @ApiParam({ name: 'sessionId', description: 'Video room session ID (e.g., Twilio room SID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session retrieved successfully',
    type: TelemedicineSessionOutputDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Session not found' })
  async findBySessionId(
    @Param('sessionId') sessionId: string,
  ): Promise<TelemedicineSessionOutputDto> {
    return this.sessionService.findBySessionId(sessionId);
  }

  @Post(':id/start')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Start/join a telemedicine session',
    description: 'Join video consultation session and receive access token for video room',
  })
  @ApiParam({ name: 'id', description: 'Telemedicine session MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session started successfully, returns video room access token',
    type: JoinSessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Session not ready or already ended',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Session not found' })
  async startSession(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<JoinSessionResponseDto> {
    const userId = req.user.id || req.user._id;
    return this.sessionService.startSession(id, userId);
  }

  @Post(':id/end')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({
    summary: 'End a telemedicine session',
    description: 'Mark session as completed by the doctor',
  })
  @ApiParam({ name: 'id', description: 'Telemedicine session MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session ended successfully',
    type: TelemedicineSessionOutputDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Session not started or already ended',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Only doctor can end session' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Session not found' })
  async endSession(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<TelemedicineSessionOutputDto> {
    const userId = req.user.id || req.user._id;
    return this.sessionService.endSession(id, userId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Cancel a scheduled telemedicine session',
    description: 'Cancel session before it starts (with reason)',
  })
  @ApiParam({ name: 'id', description: 'Telemedicine session MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session cancelled successfully',
    type: TelemedicineSessionOutputDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Session already started or completed',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Session not found' })
  async cancelSession(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ): Promise<TelemedicineSessionOutputDto> {
    const userId = req.user.id || req.user._id;
    return this.sessionService.cancelSession(id, userId, reason);
  }

  @Put(':id')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Update a scheduled telemedicine session',
    description: 'Update session details (only before session starts)',
  })
  @ApiParam({ name: 'id', description: 'Telemedicine session MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session updated successfully',
    type: TelemedicineSessionOutputDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update or session already started',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Session not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTelemedicineSessionDto,
  ): Promise<TelemedicineSessionOutputDto> {
    return this.sessionService.update(id, updateDto);
  }

  @Post(':id/clinical-notes')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Add clinical notes to completed session',
    description: 'Doctor adds post-consultation notes and observations',
  })
  @ApiParam({ name: 'id', description: 'Telemedicine session MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Clinical notes added successfully',
    type: TelemedicineSessionOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Session not completed' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Only doctor can add clinical notes' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Session not found' })
  async addClinicalNotes(
    @Param('id') id: string,
    @Body() notesDto: AddClinicalNotesDto,
  ): Promise<TelemedicineSessionOutputDto> {
    return this.sessionService.addClinicalNotes(id, notesDto);
  }

  @Post(':id/recording-consent')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Set recording consent for session',
    description: 'Capture consent from doctor or patient for session recording',
  })
  @ApiParam({ name: 'id', description: 'Telemedicine session MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recording consent set successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid consent data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Session not found' })
  @HttpCode(HttpStatus.OK)
  async setRecordingConsent(
    @Param('id') id: string,
    @Body() consentDto: RecordingConsentDto,
  ): Promise<void> {
    return this.sessionService.setRecordingConsent(id, consentDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Delete telemedicine session (soft delete)',
    description: 'Soft delete a session - Admin only',
  })
  @ApiParam({ name: 'id', description: 'Telemedicine session MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session deleted successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Session not found' })
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.sessionService.delete(id);
    return { message: 'Session deleted successfully' };
  }
}
