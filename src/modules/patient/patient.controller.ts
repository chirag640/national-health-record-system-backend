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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create new patient (Admin only)' })
  create(@Body() dto: CreatePatientDto): Promise<PatientOutputDto> {
    return this.patientService.create(dto);
  }

  @Get()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all patients' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.patientService.findAll(page, limit);
  }

  @Get('search/:searchTerm')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Search patients by GUID, name, or phone',
    description: 'Partial match search across GUID, fullName, and phone fields. Case-insensitive.',
  })
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
  findByGuid(@Param('guid') guid: string): Promise<PatientOutputDto> {
    return this.patientService.findByGuid(guid);
  }

  @Get(':id')
  @Roles(UserRole.PATIENT, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get patient details' })
  findOne(@Param('id') id: string): Promise<PatientOutputDto> {
    return this.patientService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PATIENT, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update patient information' })
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
  @ApiOperation({ summary: 'Delete patient (SuperAdmin only)' })
  remove(@Param('id') id: string): Promise<void> {
    return this.patientService.remove(id);
  }
}
