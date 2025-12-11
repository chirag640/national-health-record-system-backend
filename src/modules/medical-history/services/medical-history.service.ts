import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { UserRole } from '../../../auth/schemas/user.schema';
import { AllergyRepository } from '../repositories/allergy.repository';
import { ChronicConditionRepository } from '../repositories/chronic-condition.repository';
import { SurgicalHistoryRepository } from '../repositories/surgical-history.repository';
import { FamilyHistoryRepository } from '../repositories/family-history.repository';
import { ImmunizationRepository } from '../repositories/immunization.repository';
import { VitalSignsRepository } from '../repositories/vital-signs.repository';

import { CreateAllergyDto, UpdateAllergyDto, AllergyFilterDto } from '../dto/allergy.dto';
import {
  CreateChronicConditionDto,
  UpdateChronicConditionDto,
  ChronicConditionFilterDto,
} from '../dto/chronic-condition.dto';
import {
  CreateSurgicalHistoryDto,
  UpdateSurgicalHistoryDto,
  SurgicalHistoryFilterDto,
} from '../dto/surgical-history.dto';
import {
  CreateFamilyHistoryDto,
  UpdateFamilyHistoryDto,
  FamilyHistoryFilterDto,
} from '../dto/family-history.dto';
import {
  CreateImmunizationDto,
  UpdateImmunizationDto,
  ImmunizationFilterDto,
} from '../dto/immunization.dto';
import {
  CreateVitalSignsDto,
  UpdateVitalSignsDto,
  VitalSignsFilterDto,
} from '../dto/vital-signs.dto';

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
} from '../dto/output.dto';

import { plainToClass } from 'class-transformer';

export interface TimelineEvent {
  id: string;
  type: 'allergy' | 'condition' | 'surgery' | 'immunization' | 'vitals' | 'family-history';
  date: Date;
  title: string;
  description: string;
  severity?: string;
  data: any;
}

export interface MedicalSummary {
  activeAllergies: AllergyOutputDto[];
  activeConditions: ChronicConditionOutputDto[];
  recentSurgeries: SurgicalHistoryOutputDto[];
  overdueImmunizations: ImmunizationOutputDto[];
  latestVitals: VitalSignsOutputDto | null;
  riskFactors: FamilyHistoryOutputDto[];
}

@Injectable()
export class MedicalHistoryService {
  constructor(
    private readonly allergyRepo: AllergyRepository,
    private readonly conditionRepo: ChronicConditionRepository,
    private readonly surgeryRepo: SurgicalHistoryRepository,
    private readonly familyHistoryRepo: FamilyHistoryRepository,
    private readonly immunizationRepo: ImmunizationRepository,
    private readonly vitalSignsRepo: VitalSignsRepository,
  ) {}

  private readonly logger = new Logger(MedicalHistoryService.name);

  // ==================== ALLERGY OPERATIONS ====================
  async createAllergy(createDto: CreateAllergyDto, userId: string): Promise<AllergyOutputDto> {
    this.logger.log(`User ${userId} creating allergy record for patient ${createDto.patientId}`);
    const allergy = await this.allergyRepo.create(createDto);
    return plainToClass(AllergyOutputDto, allergy.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async getAllergy(id: string, userId: string, userRole: UserRole): Promise<AllergyOutputDto> {
    const allergy = await this.allergyRepo.findById(id);
    if (!allergy) {
      throw new NotFoundException(`Allergy with ID ${id} not found`);
    }
    // Verify patient can only access own records
    if (userRole === UserRole.PATIENT && allergy.patientId.toString() !== userId) {
      throw new ForbiddenException('Access denied to this medical record');
    }
    return plainToClass(AllergyOutputDto, allergy.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async updateAllergy(
    id: string,
    updateDto: UpdateAllergyDto,
    userId: string,
  ): Promise<AllergyOutputDto> {
    this.logger.log(`User ${userId} updating allergy record ${id}`);
    const allergy = await this.allergyRepo.update(id, updateDto);
    if (!allergy) {
      throw new NotFoundException(`Allergy with ID ${id} not found`);
    }
    return plainToClass(AllergyOutputDto, allergy.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async deleteAllergy(id: string, userId: string): Promise<void> {
    this.logger.warn(`User ${userId} deleting allergy record ${id}`);
    const deleted = await this.allergyRepo.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Allergy with ID ${id} not found`);
    }
  }

  async getAllergiesByPatient(
    patientId: string,
    filterDto?: AllergyFilterDto,
  ): Promise<PaginatedAllergyOutputDto> {
    const { data, total } = await this.allergyRepo.findByPatient(patientId, filterDto);
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;

    return plainToClass(
      PaginatedAllergyOutputDto,
      {
        data: data.map((item) => item.toObject()),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { excludeExtraneousValues: true },
    );
  }

  async getCriticalAllergies(patientId: string): Promise<AllergyOutputDto[]> {
    const allergies = await this.allergyRepo.findCriticalAllergies(patientId);
    return allergies.map((a) =>
      plainToClass(AllergyOutputDto, a.toObject(), { excludeExtraneousValues: true }),
    );
  }

  // ==================== CHRONIC CONDITION OPERATIONS ====================
  async createChronicCondition(
    createDto: CreateChronicConditionDto,
    userId: string,
  ): Promise<ChronicConditionOutputDto> {
    this.logger.log(`User ${userId} creating chronic condition for patient ${createDto.patientId}`);
    const condition = await this.conditionRepo.create(createDto);
    return plainToClass(ChronicConditionOutputDto, condition.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async getChronicCondition(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<ChronicConditionOutputDto> {
    const condition = await this.conditionRepo.findById(id);
    if (!condition) {
      throw new NotFoundException(`Chronic condition with ID ${id} not found`);
    }
    if (userRole === UserRole.PATIENT && condition.patientId.toString() !== userId) {
      throw new ForbiddenException('Access denied to this medical record');
    }
    return plainToClass(ChronicConditionOutputDto, condition.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async updateChronicCondition(
    id: string,
    updateDto: UpdateChronicConditionDto,
    userId: string,
  ): Promise<ChronicConditionOutputDto> {
    this.logger.log(`User ${userId} updating chronic condition ${id}`);
    const condition = await this.conditionRepo.update(id, updateDto);
    if (!condition) {
      throw new NotFoundException(`Chronic condition with ID ${id} not found`);
    }
    return plainToClass(ChronicConditionOutputDto, condition.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async deleteChronicCondition(id: string, userId: string): Promise<void> {
    this.logger.warn(`User ${userId} deleting chronic condition ${id}`);
    const deleted = await this.conditionRepo.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Chronic condition with ID ${id} not found`);
    }
  }

  async getChronicConditionsByPatient(
    patientId: string,
    filterDto?: ChronicConditionFilterDto,
  ): Promise<PaginatedChronicConditionOutputDto> {
    const { data, total } = await this.conditionRepo.findByPatient(patientId, filterDto);
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;

    return plainToClass(
      PaginatedChronicConditionOutputDto,
      {
        data: data.map((item) => item.toObject()),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { excludeExtraneousValues: true },
    );
  }

  async getOverdueReviews(patientId: string): Promise<ChronicConditionOutputDto[]> {
    const conditions = await this.conditionRepo.findOverdueReviews(patientId);
    return conditions.map((c) =>
      plainToClass(ChronicConditionOutputDto, c.toObject(), { excludeExtraneousValues: true }),
    );
  }

  // ==================== SURGICAL HISTORY OPERATIONS ====================
  async createSurgicalHistory(
    createDto: CreateSurgicalHistoryDto,
    userId: string,
  ): Promise<SurgicalHistoryOutputDto> {
    this.logger.log(`User ${userId} creating surgical history for patient ${createDto.patientId}`);
    const surgery = await this.surgeryRepo.create(createDto);
    return plainToClass(SurgicalHistoryOutputDto, surgery.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async getSurgicalHistory(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<SurgicalHistoryOutputDto> {
    const surgery = await this.surgeryRepo.findById(id);
    if (!surgery) {
      throw new NotFoundException(`Surgical history with ID ${id} not found`);
    }
    if (userRole === UserRole.PATIENT && surgery.patientId.toString() !== userId) {
      throw new ForbiddenException('Access denied to this medical record');
    }
    return plainToClass(SurgicalHistoryOutputDto, surgery.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async updateSurgicalHistory(
    id: string,
    updateDto: UpdateSurgicalHistoryDto,
    userId: string,
  ): Promise<SurgicalHistoryOutputDto> {
    this.logger.log(`User ${userId} updating surgical history ${id}`);
    const surgery = await this.surgeryRepo.update(id, updateDto);
    if (!surgery) {
      throw new NotFoundException(`Surgical history with ID ${id} not found`);
    }
    return plainToClass(SurgicalHistoryOutputDto, surgery.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async deleteSurgicalHistory(id: string, userId: string): Promise<void> {
    this.logger.warn(`User ${userId} deleting surgical history ${id}`);
    const deleted = await this.surgeryRepo.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Surgical history with ID ${id} not found`);
    }
  }

  async getSurgicalHistoriesByPatient(
    patientId: string,
    filterDto?: SurgicalHistoryFilterDto,
  ): Promise<PaginatedSurgicalHistoryOutputDto> {
    const { data, total } = await this.surgeryRepo.findByPatient(patientId, filterDto);
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;

    return plainToClass(
      PaginatedSurgicalHistoryOutputDto,
      {
        data: data.map((item) => item.toObject()),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { excludeExtraneousValues: true },
    );
  }

  // ==================== FAMILY HISTORY OPERATIONS ====================
  async createFamilyHistory(
    createDto: CreateFamilyHistoryDto,
    userId: string,
  ): Promise<FamilyHistoryOutputDto> {
    this.logger.log(`User ${userId} creating family history for patient ${createDto.patientId}`);
    const history = await this.familyHistoryRepo.create(createDto);
    return plainToClass(FamilyHistoryOutputDto, history.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async getFamilyHistory(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<FamilyHistoryOutputDto> {
    const history = await this.familyHistoryRepo.findById(id);
    if (!history) {
      throw new NotFoundException(`Family history with ID ${id} not found`);
    }
    if (userRole === UserRole.PATIENT && history.patientId.toString() !== userId) {
      throw new ForbiddenException('Access denied to this medical record');
    }
    return plainToClass(FamilyHistoryOutputDto, history.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async updateFamilyHistory(
    id: string,
    updateDto: UpdateFamilyHistoryDto,
    userId: string,
  ): Promise<FamilyHistoryOutputDto> {
    this.logger.log(`User ${userId} updating family history ${id}`);
    const history = await this.familyHistoryRepo.update(id, updateDto);
    if (!history) {
      throw new NotFoundException(`Family history with ID ${id} not found`);
    }
    return plainToClass(FamilyHistoryOutputDto, history.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async deleteFamilyHistory(id: string, userId: string): Promise<void> {
    this.logger.warn(`User ${userId} deleting family history ${id}`);
    const deleted = await this.familyHistoryRepo.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Family history with ID ${id} not found`);
    }
  }

  async getFamilyHistoriesByPatient(
    patientId: string,
    filterDto?: FamilyHistoryFilterDto,
  ): Promise<PaginatedFamilyHistoryOutputDto> {
    const { data, total } = await this.familyHistoryRepo.findByPatient(patientId, filterDto);
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;

    return plainToClass(
      PaginatedFamilyHistoryOutputDto,
      {
        data: data.map((item) => item.toObject()),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { excludeExtraneousValues: true },
    );
  }

  async getRiskAssessment(patientId: string): Promise<FamilyHistoryOutputDto[]> {
    const risks = await this.familyHistoryRepo.getRiskAssessment(patientId);
    return risks.map((r) =>
      plainToClass(FamilyHistoryOutputDto, r.toObject(), { excludeExtraneousValues: true }),
    );
  }

  // ==================== IMMUNIZATION OPERATIONS ====================
  async createImmunization(
    createDto: CreateImmunizationDto,
    userId: string,
  ): Promise<ImmunizationOutputDto> {
    this.logger.log(`User ${userId} creating immunization for patient ${createDto.patientId}`);
    const immunization = await this.immunizationRepo.create(createDto);
    return plainToClass(ImmunizationOutputDto, immunization.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async getImmunization(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<ImmunizationOutputDto> {
    const immunization = await this.immunizationRepo.findById(id);
    if (!immunization) {
      throw new NotFoundException(`Immunization with ID ${id} not found`);
    }
    if (userRole === UserRole.PATIENT && immunization.patientId.toString() !== userId) {
      throw new ForbiddenException('Access denied to this medical record');
    }
    return plainToClass(ImmunizationOutputDto, immunization.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async updateImmunization(
    id: string,
    updateDto: UpdateImmunizationDto,
    userId: string,
  ): Promise<ImmunizationOutputDto> {
    this.logger.log(`User ${userId} updating immunization ${id}`);
    const immunization = await this.immunizationRepo.update(id, updateDto);
    if (!immunization) {
      throw new NotFoundException(`Immunization with ID ${id} not found`);
    }
    return plainToClass(ImmunizationOutputDto, immunization.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async deleteImmunization(id: string, userId: string): Promise<void> {
    this.logger.warn(`User ${userId} deleting immunization ${id}`);
    const deleted = await this.immunizationRepo.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Immunization with ID ${id} not found`);
    }
  }

  async getImmunizationsByPatient(
    patientId: string,
    filterDto?: ImmunizationFilterDto,
  ): Promise<PaginatedImmunizationOutputDto> {
    const { data, total } = await this.immunizationRepo.findByPatient(patientId, filterDto);
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;

    return plainToClass(
      PaginatedImmunizationOutputDto,
      {
        data: data.map((item) => item.toObject()),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { excludeExtraneousValues: true },
    );
  }

  async getOverdueImmunizations(patientId: string): Promise<ImmunizationOutputDto[]> {
    const immunizations = await this.immunizationRepo.findOverdueImmunizations(patientId);
    return immunizations.map((i) =>
      plainToClass(ImmunizationOutputDto, i.toObject(), { excludeExtraneousValues: true }),
    );
  }

  // ==================== VITAL SIGNS OPERATIONS ====================
  async createVitalSigns(
    createDto: CreateVitalSignsDto,
    userId: string,
  ): Promise<VitalSignsOutputDto> {
    this.logger.log(`User ${userId} recording vital signs for patient ${createDto.patientId}`);
    const vitalSigns = await this.vitalSignsRepo.create(createDto);
    return plainToClass(VitalSignsOutputDto, vitalSigns.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async getVitalSigns(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<VitalSignsOutputDto> {
    const vitalSigns = await this.vitalSignsRepo.findById(id);
    if (!vitalSigns) {
      throw new NotFoundException(`Vital signs with ID ${id} not found`);
    }
    if (userRole === UserRole.PATIENT && vitalSigns.patientId.toString() !== userId) {
      throw new ForbiddenException('Access denied to this medical record');
    }
    return plainToClass(VitalSignsOutputDto, vitalSigns.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async updateVitalSigns(
    id: string,
    updateDto: UpdateVitalSignsDto,
    userId: string,
  ): Promise<VitalSignsOutputDto> {
    this.logger.log(`User ${userId} updating vital signs ${id}`);
    const vitalSigns = await this.vitalSignsRepo.update(id, updateDto);
    if (!vitalSigns) {
      throw new NotFoundException(`Vital signs with ID ${id} not found`);
    }
    return plainToClass(VitalSignsOutputDto, vitalSigns.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async deleteVitalSigns(id: string, userId: string): Promise<void> {
    this.logger.warn(`User ${userId} deleting vital signs ${id}`);
    const deleted = await this.vitalSignsRepo.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Vital signs with ID ${id} not found`);
    }
  }

  async getVitalSignsByPatient(
    patientId: string,
    filterDto?: VitalSignsFilterDto,
  ): Promise<PaginatedVitalSignsOutputDto> {
    const { data, total } = await this.vitalSignsRepo.findByPatient(patientId, filterDto);
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;

    return plainToClass(
      PaginatedVitalSignsOutputDto,
      {
        data: data.map((item) => item.toObject()),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { excludeExtraneousValues: true },
    );
  }

  async getLatestVitalSigns(patientId: string): Promise<VitalSignsOutputDto | null> {
    const vitalSigns = await this.vitalSignsRepo.getLatest(patientId);
    if (!vitalSigns) {
      return null;
    }
    return plainToClass(VitalSignsOutputDto, vitalSigns.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async getVitalSignsTrends(patientId: string, days: number = 30): Promise<VitalSignsOutputDto[]> {
    const trends = await this.vitalSignsRepo.getTrends(patientId, days);
    return trends.map((t) =>
      plainToClass(VitalSignsOutputDto, t.toObject(), { excludeExtraneousValues: true }),
    );
  }

  // ==================== AGGREGATED OPERATIONS ====================

  /**
   * Get comprehensive medical summary for a patient
   */
  async getMedicalSummary(patientId: string): Promise<MedicalSummary> {
    const [
      activeAllergies,
      activeConditions,
      recentSurgeries,
      overdueImmunizations,
      latestVitals,
      riskFactors,
    ] = await Promise.all([
      this.allergyRepo.findActiveAllergies(patientId),
      this.conditionRepo.findActiveConditions(patientId),
      this.surgeryRepo.findByPatient(patientId, { page: 1, limit: 5 }),
      this.immunizationRepo.findOverdueImmunizations(patientId),
      this.vitalSignsRepo.getLatest(patientId),
      this.familyHistoryRepo.getRiskAssessment(patientId),
    ]);

    return {
      activeAllergies: activeAllergies.map((a) =>
        plainToClass(AllergyOutputDto, a.toObject(), { excludeExtraneousValues: true }),
      ),
      activeConditions: activeConditions.map((c) =>
        plainToClass(ChronicConditionOutputDto, c.toObject(), { excludeExtraneousValues: true }),
      ),
      recentSurgeries: recentSurgeries.data.map((s) =>
        plainToClass(SurgicalHistoryOutputDto, s.toObject(), { excludeExtraneousValues: true }),
      ),
      overdueImmunizations: overdueImmunizations.map((i) =>
        plainToClass(ImmunizationOutputDto, i.toObject(), { excludeExtraneousValues: true }),
      ),
      latestVitals: latestVitals
        ? plainToClass(VitalSignsOutputDto, latestVitals.toObject(), {
            excludeExtraneousValues: true,
          })
        : null,
      riskFactors: riskFactors.map((r) =>
        plainToClass(FamilyHistoryOutputDto, r.toObject(), { excludeExtraneousValues: true }),
      ),
    };
  }

  /**
   * Get chronological timeline of all medical events
   */
  async getTimeline(patientId: string, startDate?: Date, endDate?: Date): Promise<TimelineEvent[]> {
    const timeline: TimelineEvent[] = [];

    // Fetch all medical history data
    const [allergies, conditions, surgeries, familyHistory, immunizations, vitalSigns] =
      await Promise.all([
        this.allergyRepo.findByPatient(patientId, {}),
        this.conditionRepo.findByPatient(patientId, {}),
        this.surgeryRepo.findByPatient(patientId, {}),
        this.familyHistoryRepo.findByPatient(patientId, {}),
        this.immunizationRepo.findByPatient(patientId, {}),
        startDate && endDate
          ? this.vitalSignsRepo.findByDateRange(patientId, startDate, endDate)
          : this.vitalSignsRepo.findByPatient(patientId, { limit: 50 }).then((r) => r.data),
      ]);

    // Add allergies to timeline
    allergies.data.forEach((allergy) => {
      timeline.push({
        id: allergy._id.toString(),
        type: 'allergy',
        date: allergy.diagnosedDate || allergy.createdAt,
        title: `Allergy Identified: ${allergy.allergen}`,
        description: `${allergy.type} allergy (${allergy.severity})`,
        severity: allergy.severity,
        data: plainToClass(AllergyOutputDto, allergy.toObject(), { excludeExtraneousValues: true }),
      });
    });

    // Add chronic conditions
    conditions.data.forEach((condition) => {
      timeline.push({
        id: condition._id.toString(),
        type: 'condition',
        date: condition.diagnosedDate,
        title: `Diagnosed: ${condition.conditionName}`,
        description: `Status: ${condition.status}, Severity: ${condition.severity || 'N/A'}`,
        severity: condition.severity,
        data: plainToClass(ChronicConditionOutputDto, condition.toObject(), {
          excludeExtraneousValues: true,
        }),
      });
    });

    // Add surgeries
    surgeries.data.forEach((surgery) => {
      timeline.push({
        id: surgery._id.toString(),
        type: 'surgery',
        date: surgery.surgeryDate,
        title: `Surgery: ${surgery.surgeryName}`,
        description: `Type: ${surgery.surgeryType}, Outcome: ${surgery.outcome}`,
        data: plainToClass(SurgicalHistoryOutputDto, surgery.toObject(), {
          excludeExtraneousValues: true,
        }),
      });
    });

    // Add immunizations
    immunizations.data.forEach((immunization) => {
      immunization.doses?.forEach((dose) => {
        timeline.push({
          id: `${immunization._id}-dose-${dose.doseNumber}`,
          type: 'immunization',
          date: dose.administeredDate,
          title: `Vaccination: ${immunization.vaccineName} (Dose ${dose.doseNumber})`,
          description: `Site: ${dose.site}, Route: ${dose.route}`,
          data: plainToClass(ImmunizationOutputDto, immunization.toObject(), {
            excludeExtraneousValues: true,
          }),
        });
      });
    });

    // Add vital signs (only abnormal or significant ones)
    vitalSigns.forEach((vitals) => {
      if (vitals.hasAbnormalValues) {
        timeline.push({
          id: vitals._id.toString(),
          type: 'vitals',
          date: vitals.recordedAt,
          title: 'Abnormal Vital Signs Recorded',
          description: `BP: ${vitals.systolicBP}/${vitals.diastolicBP}, HR: ${vitals.heartRate}, SpO2: ${vitals.oxygenSaturation}%`,
          severity: 'moderate',
          data: plainToClass(VitalSignsOutputDto, vitals.toObject(), {
            excludeExtraneousValues: true,
          }),
        });
      }
    });

    // Add family history
    familyHistory.data.forEach((history) => {
      timeline.push({
        id: history._id.toString(),
        type: 'family-history',
        date: history.createdAt,
        title: `Family History: ${history.condition}`,
        description: `Relation: ${history.relationship}, Note: ${history.notes || 'None'}`,
        data: plainToClass(FamilyHistoryOutputDto, history.toObject(), {
          excludeExtraneousValues: true,
        }),
      });
    });

    // Sort timeline by date (most recent first)
    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

    return timeline;
  }
}
