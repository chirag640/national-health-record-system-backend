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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EncounterService } from './encounter.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { UpdateEncounterDto } from './dto/update-encounter.dto';
import { EncounterOutputDto } from './dto/encounter-output.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ConsentGuard } from '../../auth/guards/consent.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/schemas/user.schema';

@ApiTags('Encounters')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'encounters', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard, ConsentGuard)
export class EncounterController {
  constructor(private readonly encounterService: EncounterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Create new encounter (Doctor only)',
    description:
      'Doctor creates medical encounter for patient visit. Requires active consent from patient.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Encounter created successfully',
    type: EncounterOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid encounter data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Doctor role required or consent missing',
  })
  create(@Body() dto: CreateEncounterDto): Promise<EncounterOutputDto> {
    return this.encounterService.create(dto);
  }

  @Get()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List all encounters (Admin only)',
    description: 'Retrieve paginated list of all encounters across the system',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Encounters retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin role required' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.encounterService.findAll(page, limit);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Find encounters by patient',
    description: 'Patient can view own encounters. Doctor requires consent.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient ID (NHRS format or MongoDB ID)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Patient encounters retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Consent required for doctors',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Patient not found' })
  findByPatient(
    @Param('patientId') patientId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.encounterService.findByPatient(patientId, page, limit);
  }

  @Get('search/advanced')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Advanced encounter search',
    description: 'Search encounters by patient, doctor, hospital, date range, or diagnosis',
  })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filter by patient ID' })
  @ApiQuery({ name: 'doctorId', required: false, description: 'Filter by doctor ID' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter from date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter to date (ISO 8601)' })
  @ApiQuery({ name: 'diagnosis', required: false, description: 'Search by diagnosis text' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  search(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('diagnosis') diagnosis?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters = {
      patientId,
      doctorId,
      hospitalId,
      diagnosis,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    return this.encounterService.search(filters, page, limit);
  }

  @Get(':id')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get encounter details',
    description: 'Patient can view own encounters. Doctor requires consent. Admin has full access.',
  })
  @ApiParam({ name: 'id', description: 'Encounter MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Encounter retrieved successfully',
    type: EncounterOutputDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Consent required' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Encounter not found' })
  findOne(@Param('id') id: string): Promise<EncounterOutputDto> {
    return this.encounterService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Update encounter (Doctor only)',
    description: 'Doctor can modify encounter within 24 hours of creation.',
  })
  @ApiParam({ name: 'id', description: 'Encounter MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Encounter updated successfully',
    type: EncounterOutputDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update data or update window expired',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Doctor role required' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Encounter not found' })
  update(@Param('id') id: string, @Body() dto: UpdateEncounterDto): Promise<EncounterOutputDto> {
    return this.encounterService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete encounter (SuperAdmin only - AUDIT VIOLATION)',
    description:
      '⚠️ WARNING: Encounters should never be deleted for legal compliance. Use soft delete.',
  })
  @ApiParam({ name: 'id', description: 'Encounter MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Encounter deleted (AUDIT LOG ENTRY CREATED)',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - SuperAdmin only' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Encounter not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.encounterService.remove(id);
  }
}
