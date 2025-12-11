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
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { PatientService } from './patient.service';
import { PatientIdCardService } from './patient-id-card.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientOutputDto } from './dto/patient-output.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/schemas/user.schema';

@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'patients', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly patientIdCardService: PatientIdCardService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create new patient (Admin only)',
    description:
      'Register new patient in the system with complete demographic and medical information',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Patient created successfully with auto-generated GUID',
    type: PatientOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid patient data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin role required' })
  create(@Body() dto: CreatePatientDto): Promise<PatientOutputDto> {
    return this.patientService.create(dto);
  }

  @Get()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List all patients',
    description: 'Retrieve paginated list of all registered patients',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Patients retrieved successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.patientService.findAll(page, limit);
  }

  @Get('search/:searchTerm')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Search patients by GUID, name, or phone',
    description: 'Partial match search across GUID, fullName, and phone fields. Case-insensitive.',
  })
  @ApiParam({ name: 'searchTerm', description: 'Search keyword (GUID, name, or phone)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  search(
    @Param('searchTerm') searchTerm: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.patientService.search(searchTerm, page, limit);
  }

  @Get('guid/:guid')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Find patient by GUID',
    description: 'Exact match search by patient GUID (e.g., NHRS-2025-A3B4C5D6)',
  })
  @ApiParam({ name: 'guid', description: 'Patient GUID (NHRS format)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Patient found', type: PatientOutputDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Patient not found' })
  findByGuid(@Param('guid') guid: string): Promise<PatientOutputDto> {
    return this.patientService.findByGuid(guid);
  }

  @Get(':id')
  @Roles(UserRole.PATIENT, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get patient details',
    description: 'Retrieve complete patient profile with medical and demographic information',
  })
  @ApiParam({ name: 'id', description: 'Patient MongoDB ID or GUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Patient retrieved successfully',
    type: PatientOutputDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Patient not found' })
  findOne(@Param('id') id: string): Promise<PatientOutputDto> {
    return this.patientService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PATIENT, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update patient information',
    description: 'Patient can update own profile. Admin can update any patient.',
  })
  @ApiParam({ name: 'id', description: 'Patient MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Patient updated successfully',
    type: PatientOutputDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid update data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Cannot update other patients',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Patient not found' })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto): Promise<PatientOutputDto> {
    return this.patientService.update(id, dto);
  }

  @Get(':id/id-card')
  @Roles(UserRole.PATIENT, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Generate patient ID card with QR code',
    description:
      'Downloads a PDF ID card containing patient details and QR code for hospital verification. ' +
      'QR code includes GUID and verification URL. Card size: 85.6mm x 53.98mm (credit card size).',
  })
  @ApiParam({ name: 'id', description: 'Patient MongoDB ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'PDF ID card generated successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Patient not found' })
  async generateIdCard(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const pdfBuffer = await this.patientIdCardService.generateIdCard(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=patient-id-card-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete patient (SuperAdmin only)',
    description: 'Soft delete - marks patient as inactive. Preserves all historical data.',
  })
  @ApiParam({ name: 'id', description: 'Patient MongoDB ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Patient deleted successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - SuperAdmin only' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Patient not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.patientService.remove(id);
  }
}
