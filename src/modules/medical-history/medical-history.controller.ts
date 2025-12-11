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
  HttpCode,
  HttpStatus,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalHistoryService } from './services/medical-history.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/schemas/user.schema';

import { CreateAllergyDto, UpdateAllergyDto, AllergyFilterDto } from './dto/allergy.dto';
import {
  CreateChronicConditionDto,
  UpdateChronicConditionDto,
  ChronicConditionFilterDto,
} from './dto/chronic-condition.dto';
import {
  CreateSurgicalHistoryDto,
  UpdateSurgicalHistoryDto,
  SurgicalHistoryFilterDto,
} from './dto/surgical-history.dto';
import {
  CreateFamilyHistoryDto,
  UpdateFamilyHistoryDto,
  FamilyHistoryFilterDto,
} from './dto/family-history.dto';
import {
  CreateImmunizationDto,
  UpdateImmunizationDto,
  ImmunizationFilterDto,
} from './dto/immunization.dto';
import {
  CreateVitalSignsDto,
  UpdateVitalSignsDto,
  VitalSignsFilterDto,
} from './dto/vital-signs.dto';

import {
  AllergyOutputDto,
  PaginatedAllergyOutputDto,
  ChronicConditionOutputDto,
  PaginatedChronicConditionOutputDto,
  SurgicalHistoryOutputDto,
  PaginatedSurgicalHistoryOutputDto,
  FamilyHistoryOutputDto,
  PaginatedFamilyHistoryOutputDto,
  ImmunizationOutputDto,
  PaginatedImmunizationOutputDto,
  VitalSignsOutputDto,
  PaginatedVitalSignsOutputDto,
} from './dto/output.dto';

@ApiTags('Medical History')
@ApiBearerAuth()
@Controller('medical-history')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalHistoryController {
  constructor(private readonly medicalHistoryService: MedicalHistoryService) {}

  // ==================== ALLERGY ENDPOINTS ====================

  @Post('allergies')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Create new allergy record' })
  @ApiResponse({ status: 201, description: 'Allergy created successfully', type: AllergyOutputDto })
  async createAllergy(
    @Body() createDto: CreateAllergyDto,
    @Request() req: any,
  ): Promise<AllergyOutputDto> {
    return this.medicalHistoryService.createAllergy(createDto, req.user.userId);
  }

  @Get('allergies/patient/:patientId/critical')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get critical allergies for a patient' })
  @ApiResponse({ status: 200, type: [AllergyOutputDto] })
  async getCriticalAllergies(@Param('patientId') patientId: string): Promise<AllergyOutputDto[]> {
    return this.medicalHistoryService.getCriticalAllergies(patientId);
  }

  @Get('allergies/patient/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get all allergies for a patient' })
  @ApiResponse({ status: 200, type: PaginatedAllergyOutputDto })
  async getAllergiesByPatient(
    @Param('patientId') patientId: string,
    @Query() filterDto: AllergyFilterDto,
    @Request() req: any,
  ): Promise<PaginatedAllergyOutputDto> {
    // Patients can only view their own data
    if (req.user.role === UserRole.PATIENT && req.user.userId !== patientId) {
      throw new ForbiddenException('Patients can only access their own medical records');
    }
    return this.medicalHistoryService.getAllergiesByPatient(patientId, filterDto);
  }

  @Get('allergies/:id')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get allergy by ID' })
  @ApiResponse({ status: 200, type: AllergyOutputDto })
  async getAllergy(@Param('id') id: string, @Request() req: any): Promise<AllergyOutputDto> {
    return this.medicalHistoryService.getAllergy(id, req.user.userId, req.user.role);
  }

  @Put('allergies/:id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Update allergy record' })
  @ApiResponse({ status: 200, type: AllergyOutputDto })
  async updateAllergy(
    @Param('id') id: string,
    @Body() updateDto: UpdateAllergyDto,
    @Request() req: any,
  ): Promise<AllergyOutputDto> {
    return this.medicalHistoryService.updateAllergy(id, updateDto, req.user.userId);
  }

  @Delete('allergies/:id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete allergy record' })
  @ApiResponse({ status: 204, description: 'Allergy deleted successfully' })
  async deleteAllergy(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.medicalHistoryService.deleteAllergy(id, req.user.userId);
  }

  // ==================== CHRONIC CONDITION ENDPOINTS ====================

  @Post('conditions')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Create new chronic condition record' })
  @ApiResponse({ status: 201, type: ChronicConditionOutputDto })
  async createChronicCondition(
    @Body() createDto: CreateChronicConditionDto,
    @Request() req: any,
  ): Promise<ChronicConditionOutputDto> {
    return this.medicalHistoryService.createChronicCondition(createDto, req.user.userId);
  }

  @Get('conditions/patient/:patientId/overdue-reviews')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get conditions with overdue reviews' })
  @ApiResponse({ status: 200, type: [ChronicConditionOutputDto] })
  async getOverdueReviews(
    @Param('patientId') patientId: string,
  ): Promise<ChronicConditionOutputDto[]> {
    return this.medicalHistoryService.getOverdueReviews(patientId);
  }

  @Get('conditions/patient/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get all chronic conditions for a patient' })
  @ApiResponse({ status: 200, type: PaginatedChronicConditionOutputDto })
  async getChronicConditionsByPatient(
    @Param('patientId') patientId: string,
    @Query() filterDto: ChronicConditionFilterDto,
    @Request() req: any,
  ): Promise<PaginatedChronicConditionOutputDto> {
    if (req.user.role === UserRole.PATIENT && req.user.userId !== patientId) {
      throw new ForbiddenException('Patients can only access their own medical records');
    }
    return this.medicalHistoryService.getChronicConditionsByPatient(patientId, filterDto);
  }

  @Get('conditions/:id')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get chronic condition by ID' })
  @ApiResponse({ status: 200, type: ChronicConditionOutputDto })
  async getChronicCondition(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ChronicConditionOutputDto> {
    return this.medicalHistoryService.getChronicCondition(id, req.user.userId, req.user.role);
  }

  @Put('conditions/:id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Update chronic condition record' })
  @ApiResponse({ status: 200, type: ChronicConditionOutputDto })
  async updateChronicCondition(
    @Param('id') id: string,
    @Body() updateDto: UpdateChronicConditionDto,
    @Request() req: any,
  ): Promise<ChronicConditionOutputDto> {
    return this.medicalHistoryService.updateChronicCondition(id, updateDto, req.user.userId);
  }

  @Delete('conditions/:id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete chronic condition record' })
  @ApiResponse({ status: 204 })
  async deleteChronicCondition(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.medicalHistoryService.deleteChronicCondition(id, req.user.userId);
  }

  // ==================== SURGICAL HISTORY ENDPOINTS ====================

  @Post('surgeries')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Create new surgical history record' })
  @ApiResponse({ status: 201, type: SurgicalHistoryOutputDto })
  async createSurgicalHistory(
    @Body() createDto: CreateSurgicalHistoryDto,
    @Request() req: any,
  ): Promise<SurgicalHistoryOutputDto> {
    return this.medicalHistoryService.createSurgicalHistory(createDto, req.user.userId);
  }

  @Get('surgeries/patient/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get all surgical histories for a patient' })
  @ApiResponse({ status: 200, type: PaginatedSurgicalHistoryOutputDto })
  async getSurgicalHistoriesByPatient(
    @Param('patientId') patientId: string,
    @Query() filterDto: SurgicalHistoryFilterDto,
    @Request() req: any,
  ): Promise<PaginatedSurgicalHistoryOutputDto> {
    if (req.user.role === UserRole.PATIENT && req.user.userId !== patientId) {
      throw new ForbiddenException('Patients can only access their own medical records');
    }
    return this.medicalHistoryService.getSurgicalHistoriesByPatient(patientId, filterDto);
  }

  @Get('surgeries/:id')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get surgical history by ID' })
  @ApiResponse({ status: 200, type: SurgicalHistoryOutputDto })
  async getSurgicalHistory(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<SurgicalHistoryOutputDto> {
    return this.medicalHistoryService.getSurgicalHistory(id, req.user.userId, req.user.role);
  }

  @Put('surgeries/:id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Update surgical history record' })
  @ApiResponse({ status: 200, type: SurgicalHistoryOutputDto })
  async updateSurgicalHistory(
    @Param('id') id: string,
    @Body() updateDto: UpdateSurgicalHistoryDto,
    @Request() req: any,
  ): Promise<SurgicalHistoryOutputDto> {
    return this.medicalHistoryService.updateSurgicalHistory(id, updateDto, req.user.userId);
  }

  @Delete('surgeries/:id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete surgical history record' })
  @ApiResponse({ status: 204 })
  async deleteSurgicalHistory(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.medicalHistoryService.deleteSurgicalHistory(id, req.user.userId);
  }

  // ==================== FAMILY HISTORY ENDPOINTS ====================

  @Post('family-history')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Create new family history record' })
  @ApiResponse({ status: 201, type: FamilyHistoryOutputDto })
  async createFamilyHistory(
    @Body() createDto: CreateFamilyHistoryDto,
    @Request() req: any,
  ): Promise<FamilyHistoryOutputDto> {
    return this.medicalHistoryService.createFamilyHistory(createDto, req.user.userId);
  }

  @Get('family-history/patient/:patientId/risk-assessment')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get genetic risk assessment for a patient' })
  @ApiResponse({ status: 200, type: [FamilyHistoryOutputDto] })
  async getRiskAssessment(
    @Param('patientId') patientId: string,
  ): Promise<FamilyHistoryOutputDto[]> {
    return this.medicalHistoryService.getRiskAssessment(patientId);
  }

  @Get('family-history/patient/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get all family history records for a patient' })
  @ApiResponse({ status: 200, type: PaginatedFamilyHistoryOutputDto })
  async getFamilyHistoriesByPatient(
    @Param('patientId') patientId: string,
    @Query() filterDto: FamilyHistoryFilterDto,
    @Request() req: any,
  ): Promise<PaginatedFamilyHistoryOutputDto> {
    if (req.user.role === UserRole.PATIENT && req.user.userId !== patientId) {
      throw new ForbiddenException('Patients can only access their own medical records');
    }
    return this.medicalHistoryService.getFamilyHistoriesByPatient(patientId, filterDto);
  }

  @Get('family-history/:id')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get family history by ID' })
  @ApiResponse({ status: 200, type: FamilyHistoryOutputDto })
  async getFamilyHistory(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<FamilyHistoryOutputDto> {
    return this.medicalHistoryService.getFamilyHistory(id, req.user.userId, req.user.role);
  }

  @Put('family-history/:id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Update family history record' })
  @ApiResponse({ status: 200, type: FamilyHistoryOutputDto })
  async updateFamilyHistory(
    @Param('id') id: string,
    @Body() updateDto: UpdateFamilyHistoryDto,
    @Request() req: any,
  ): Promise<FamilyHistoryOutputDto> {
    return this.medicalHistoryService.updateFamilyHistory(id, updateDto, req.user.userId);
  }

  @Delete('family-history/:id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete family history record' })
  @ApiResponse({ status: 204 })
  async deleteFamilyHistory(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.medicalHistoryService.deleteFamilyHistory(id, req.user.userId);
  }

  // ==================== IMMUNIZATION ENDPOINTS ====================

  @Post('immunizations')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Create new immunization record' })
  @ApiResponse({ status: 201, type: ImmunizationOutputDto })
  async createImmunization(
    @Body() createDto: CreateImmunizationDto,
    @Request() req: any,
  ): Promise<ImmunizationOutputDto> {
    return this.medicalHistoryService.createImmunization(createDto, req.user.userId);
  }

  @Get('immunizations/patient/:patientId/overdue')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get overdue immunizations for a patient' })
  @ApiResponse({ status: 200, type: [ImmunizationOutputDto] })
  async getOverdueImmunizations(
    @Param('patientId') patientId: string,
  ): Promise<ImmunizationOutputDto[]> {
    return this.medicalHistoryService.getOverdueImmunizations(patientId);
  }

  @Get('immunizations/patient/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get all immunizations for a patient' })
  @ApiResponse({ status: 200, type: PaginatedImmunizationOutputDto })
  async getImmunizationsByPatient(
    @Param('patientId') patientId: string,
    @Query() filterDto: ImmunizationFilterDto,
    @Request() req: any,
  ): Promise<PaginatedImmunizationOutputDto> {
    if (req.user.role === UserRole.PATIENT && req.user.userId !== patientId) {
      throw new ForbiddenException('Patients can only access their own medical records');
    }
    return this.medicalHistoryService.getImmunizationsByPatient(patientId, filterDto);
  }

  @Get('immunizations/:id')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get immunization by ID' })
  @ApiResponse({ status: 200, type: ImmunizationOutputDto })
  async getImmunization(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ImmunizationOutputDto> {
    return this.medicalHistoryService.getImmunization(id, req.user.userId, req.user.role);
  }

  @Put('immunizations/:id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Update immunization record' })
  @ApiResponse({ status: 200, type: ImmunizationOutputDto })
  async updateImmunization(
    @Param('id') id: string,
    @Body() updateDto: UpdateImmunizationDto,
    @Request() req: any,
  ): Promise<ImmunizationOutputDto> {
    return this.medicalHistoryService.updateImmunization(id, updateDto, req.user.userId);
  }

  @Delete('immunizations/:id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete immunization record' })
  @ApiResponse({ status: 204 })
  async deleteImmunization(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.medicalHistoryService.deleteImmunization(id, req.user.userId);
  }

  // ==================== VITAL SIGNS ENDPOINTS ====================

  @Post('vital-signs')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Record new vital signs' })
  @ApiResponse({ status: 201, type: VitalSignsOutputDto })
  async createVitalSigns(
    @Body() createDto: CreateVitalSignsDto,
    @Request() req: any,
  ): Promise<VitalSignsOutputDto> {
    return this.medicalHistoryService.createVitalSigns(createDto, req.user.userId);
  }

  @Get('vital-signs/patient/:patientId/latest')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get latest vital signs for a patient' })
  @ApiResponse({ status: 200, type: VitalSignsOutputDto })
  async getLatestVitalSigns(
    @Param('patientId') patientId: string,
    @Request() req: any,
  ): Promise<VitalSignsOutputDto | null> {
    if (req.user.role === UserRole.PATIENT && req.user.userId !== patientId) {
      throw new ForbiddenException('Patients can only access their own medical records');
    }
    return this.medicalHistoryService.getLatestVitalSigns(patientId);
  }

  @Get('vital-signs/patient/:patientId/trends')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get vital signs trends over time' })
  @ApiResponse({ status: 200, type: [VitalSignsOutputDto] })
  async getVitalSignsTrends(
    @Param('patientId') patientId: string,
    @Query('days') days?: number,
  ): Promise<VitalSignsOutputDto[]> {
    return this.medicalHistoryService.getVitalSignsTrends(patientId, days || 30);
  }

  @Get('vital-signs/patient/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get all vital signs for a patient' })
  @ApiResponse({ status: 200, type: PaginatedVitalSignsOutputDto })
  async getVitalSignsByPatient(
    @Param('patientId') patientId: string,
    @Query() filterDto: VitalSignsFilterDto,
    @Request() req: any,
  ): Promise<PaginatedVitalSignsOutputDto> {
    if (req.user.role === UserRole.PATIENT && req.user.userId !== patientId) {
      throw new ForbiddenException('Patients can only access their own medical records');
    }
    return this.medicalHistoryService.getVitalSignsByPatient(patientId, filterDto);
  }

  @Get('vital-signs/:id')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get vital signs by ID' })
  @ApiResponse({ status: 200, type: VitalSignsOutputDto })
  async getVitalSigns(@Param('id') id: string, @Request() req: any): Promise<VitalSignsOutputDto> {
    return this.medicalHistoryService.getVitalSigns(id, req.user.userId, req.user.role);
  }

  @Put('vital-signs/:id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Update vital signs record' })
  @ApiResponse({ status: 200, type: VitalSignsOutputDto })
  async updateVitalSigns(
    @Param('id') id: string,
    @Body() updateDto: UpdateVitalSignsDto,
    @Request() req: any,
  ): Promise<VitalSignsOutputDto> {
    return this.medicalHistoryService.updateVitalSigns(id, updateDto, req.user.userId);
  }

  @Delete('vital-signs/:id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete vital signs record' })
  @ApiResponse({ status: 204 })
  async deleteVitalSigns(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.medicalHistoryService.deleteVitalSigns(id, req.user.userId);
  }

  // ==================== AGGREGATED ENDPOINTS ====================

  @Get('summary/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get comprehensive medical summary for a patient' })
  @ApiResponse({
    status: 200,
    description: 'Medical summary with active allergies, conditions, recent surgeries, etc.',
  })
  async getMedicalSummary(@Param('patientId') patientId: string, @Request() req: any) {
    if (req.user.role === UserRole.PATIENT && req.user.userId !== patientId) {
      throw new ForbiddenException('Patients can only access their own medical records');
    }
    return this.medicalHistoryService.getMedicalSummary(patientId);
  }

  @Get('timeline/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get chronological timeline of all medical events' })
  @ApiResponse({ status: 200, description: 'Timeline of medical events' })
  async getTimeline(
    @Param('patientId') patientId: string,
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (req.user.role === UserRole.PATIENT && req.user.userId !== patientId) {
      throw new ForbiddenException('Patients can only access their own medical records');
    }
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.medicalHistoryService.getTimeline(patientId, start, end);
  }
}
