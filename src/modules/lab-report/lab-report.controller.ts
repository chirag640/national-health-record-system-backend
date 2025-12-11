import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LabReportService } from './lab-report.service';
import { CreateLabReportDto } from './dto/create-lab-report.dto';
import { UpdateLabReportDto } from './dto/update-lab-report.dto';
import { LabReportFilterDto } from './dto/lab-report-filter.dto';
import {
  LabReportOutputDto,
  PaginatedLabReportsDto,
  LabReportStatsDto,
  TrendAnalysisDto,
} from './dto/lab-report-output.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserPayload } from '../../common/interfaces/user-payload.interface';
import { UserRole } from '../../auth/schemas/user.schema';

@ApiTags('Lab Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lab-reports')
export class LabReportController {
  private readonly logger = new Logger(LabReportController.name);

  constructor(private readonly labReportService: LabReportService) {}

  /**
   * Create a new lab report
   */
  @Post()
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create a new lab report' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Lab report created successfully',
    type: LabReportOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async create(
    @Body() createDto: CreateLabReportDto,
    @CurrentUser() user: UserPayload,
  ): Promise<LabReportOutputDto> {
    this.logger.log(`User ${user.userId} creating lab report for patient ${createDto.patientId}`);
    return this.labReportService.create(createDto);
  }

  /**
   * Get all lab reports with filters and pagination
   */
  @Get()
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get all lab reports with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lab reports retrieved successfully',
    type: PaginatedLabReportsDto,
  })
  async findAll(@Query() filterDto: LabReportFilterDto): Promise<PaginatedLabReportsDto> {
    return this.labReportService.findAll(filterDto);
  }

  /**
   * Get lab report by ID
   */
  @Get(':id')
  @Roles(
    UserRole.DOCTOR,
    UserRole.PATIENT,
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.DOCTOR,
  )
  @ApiOperation({ summary: 'Get lab report by ID' })
  @ApiParam({ name: 'id', description: 'Lab report ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lab report retrieved successfully',
    type: LabReportOutputDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lab report not found' })
  async findById(@Param('id') id: string): Promise<LabReportOutputDto> {
    return this.labReportService.findById(id);
  }

  /**
   * Get lab report by report ID
   */
  @Get('report-id/:reportId')
  @Roles(
    UserRole.DOCTOR,
    UserRole.PATIENT,
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.DOCTOR,
  )
  @ApiOperation({ summary: 'Get lab report by report ID' })
  @ApiParam({ name: 'reportId', description: 'Report ID (e.g., LAB-2024-001234)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lab report retrieved successfully',
    type: LabReportOutputDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lab report not found' })
  async findByReportId(@Param('reportId') reportId: string): Promise<LabReportOutputDto> {
    return this.labReportService.findByReportId(reportId);
  }

  /**
   * Get lab reports by patient ID
   */
  @Get('patient/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get lab reports by patient ID' })
  @ApiParam({ name: 'patientId', description: 'Patient GUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lab reports retrieved successfully',
    type: [LabReportOutputDto],
  })
  async findByPatientId(@Param('patientId') patientId: string): Promise<LabReportOutputDto[]> {
    return this.labReportService.findByPatientId(patientId);
  }

  /**
   * Get lab reports by doctor ID
   */
  @Get('doctor/:doctorId')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get lab reports by doctor ID' })
  @ApiParam({ name: 'doctorId', description: 'Doctor ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lab reports retrieved successfully',
    type: [LabReportOutputDto],
  })
  async findByDoctorId(@Param('doctorId') doctorId: string): Promise<LabReportOutputDto[]> {
    return this.labReportService.findByDoctorId(doctorId);
  }

  /**
   * Get lab reports by hospital ID
   */
  @Get('hospital/:hospitalId')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get lab reports by hospital ID' })
  @ApiParam({ name: 'hospitalId', description: 'Hospital ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lab reports retrieved successfully',
    type: [LabReportOutputDto],
  })
  async findByHospitalId(@Param('hospitalId') hospitalId: string): Promise<LabReportOutputDto[]> {
    return this.labReportService.findByHospitalId(hospitalId);
  }

  /**
   * Update lab report
   */
  @Put(':id')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update lab report' })
  @ApiParam({ name: 'id', description: 'Lab report ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lab report updated successfully',
    type: LabReportOutputDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lab report not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLabReportDto,
    @CurrentUser() user: UserPayload,
  ): Promise<LabReportOutputDto> {
    this.logger.log(`User ${user.userId} updating lab report ${id}`);
    return this.labReportService.update(id, updateDto);
  }

  /**
   * Delete lab report (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Delete lab report (soft delete)' })
  @ApiParam({ name: 'id', description: 'Lab report ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Lab report deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lab report not found' })
  async delete(@Param('id') id: string, @CurrentUser() user: UserPayload): Promise<void> {
    this.logger.log(`User ${user.userId} deleting lab report ${id}`);
    return this.labReportService.delete(id);
  }

  /**
   * Get lab report statistics
   */
  @Get('stats/summary')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get lab report statistics' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filter by patient ID' })
  @ApiQuery({ name: 'doctorId', required: false, description: 'Filter by doctor ID' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: LabReportStatsDto,
  })
  async getStatistics(@Query() filters?: Partial<LabReportFilterDto>): Promise<LabReportStatsDto> {
    return this.labReportService.getStatistics(filters);
  }

  /**
   * Get trend analysis for a test parameter
   */
  @Get('trends/:patientId/:parameterName')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get trend analysis for a specific test parameter' })
  @ApiParam({ name: 'patientId', description: 'Patient GUID' })
  @ApiParam({ name: 'parameterName', description: 'Test parameter name (e.g., Hemoglobin)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of data points', example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trend analysis retrieved successfully',
    type: TrendAnalysisDto,
  })
  async getTrendAnalysis(
    @Param('patientId') patientId: string,
    @Param('parameterName') parameterName: string,
    @Query('limit') limit?: number,
  ): Promise<TrendAnalysisDto> {
    return this.labReportService.getTrendAnalysis(patientId, parameterName, limit || 10);
  }

  /**
   * Get recent lab reports
   */
  @Get('recent/list')
  @Roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get recent lab reports' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of reports', example: 10 })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent reports retrieved successfully',
    type: [LabReportOutputDto],
  })
  async getRecentReports(
    @Query('limit') limit?: number,
    @Query('hospitalId') hospitalId?: string,
  ): Promise<LabReportOutputDto[]> {
    return this.labReportService.getRecentReports(limit || 10, hospitalId);
  }

  /**
   * Process critical lab reports (admin endpoint)
   */
  @Post('process/critical')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Process critical lab reports and send notifications' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Critical reports processed successfully' })
  async processCriticalReports(@CurrentUser() user: UserPayload): Promise<{ message: string }> {
    this.logger.log(`User ${user.userId} triggering critical reports processing`);
    await this.labReportService.processCriticalReports();
    return { message: 'Critical reports processed successfully' };
  }
}
