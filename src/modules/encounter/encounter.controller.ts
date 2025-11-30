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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
  create(@Body() dto: CreateEncounterDto): Promise<EncounterOutputDto> {
    return this.encounterService.create(dto);
  }

  @Get()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all encounters (Admin only)' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.encounterService.findAll(page, limit);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Find encounters by patient',
    description: 'Patient can view own encounters. Doctor requires consent.',
  })
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
  findOne(@Param('id') id: string): Promise<EncounterOutputDto> {
    return this.encounterService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Update encounter (Doctor only)',
    description: 'Doctor can modify encounter within 24 hours of creation.',
  })
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
  remove(@Param('id') id: string): Promise<void> {
    return this.encounterService.remove(id);
  }
}
