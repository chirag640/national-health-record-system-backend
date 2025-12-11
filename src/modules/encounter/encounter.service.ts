import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { EncounterRepository } from './encounter.repository';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { UpdateEncounterDto } from './dto/update-encounter.dto';
import { EncounterOutputDto } from './dto/encounter-output.dto';
import { PaginatedResponse, createPaginatedResponse } from '../../pagination.dto';

@Injectable()
export class EncounterService {
  constructor(private readonly encounterRepository: EncounterRepository) {}

  async create(dto: CreateEncounterDto): Promise<EncounterOutputDto> {
    const createData: any = {
      ...dto,
      doctorId: new Types.ObjectId(dto.doctorId),
      hospitalId: new Types.ObjectId(dto.hospitalId),
    };
    const created = await this.encounterRepository.create(createData);
    return this.mapToOutput(created);
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResponse<EncounterOutputDto>> {
    // Pagination defaults: page 1, limit 10, max 100
    const currentPage = Math.max(1, Number(page) || 1);
    const itemsPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const [items, total] = await Promise.all([
      this.encounterRepository.findAll(skip, itemsPerPage),
      this.encounterRepository.count(),
    ]);

    const data = items.map((item) => this.mapToOutput(item));
    return createPaginatedResponse(data, total, currentPage, itemsPerPage);
  }

  /**
   * Find encounters by patient
   */
  async findByPatient(
    patientId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<EncounterOutputDto>> {
    const currentPage = Math.max(1, Number(page) || 1);
    const itemsPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const query = { patientId };

    const [items, total] = await Promise.all([
      this.encounterRepository.search(query, skip, itemsPerPage),
      this.encounterRepository.countByQuery(query),
    ]);

    const data = items.map((item) => this.mapToOutput(item));
    return createPaginatedResponse(data, total, currentPage, itemsPerPage);
  }

  /**
   * Search encounters with filters
   */
  async search(
    filters: {
      patientId?: string;
      doctorId?: string;
      hospitalId?: string;
      startDate?: Date;
      endDate?: Date;
      diagnosis?: string;
    },
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<EncounterOutputDto>> {
    const currentPage = Math.max(1, Number(page) || 1);
    const itemsPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const query: any = {};

    if (filters.patientId) {
      query.patientId = filters.patientId;
    }
    if (filters.doctorId) {
      query.doctorId = new Types.ObjectId(filters.doctorId);
    }
    if (filters.hospitalId) {
      query.hospitalId = new Types.ObjectId(filters.hospitalId);
    }
    if (filters.diagnosis) {
      query.diagnosis = { $regex: filters.diagnosis, $options: 'i' };
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    const [items, total] = await Promise.all([
      this.encounterRepository.search(query, skip, itemsPerPage),
      this.encounterRepository.countByQuery(query),
    ]);

    const data = items.map((item) => this.mapToOutput(item));
    return createPaginatedResponse(data, total, currentPage, itemsPerPage);
  }

  async findOne(id: string): Promise<EncounterOutputDto> {
    const item = await this.encounterRepository.findById(id);
    if (!item) {
      throw new NotFoundException(`Encounter with ID ${id} not found`);
    }
    return this.mapToOutput(item);
  }

  /**
   * Update encounter with time-based restrictions
   * Doctors can only modify encounters within 24 hours of creation
   */
  async update(id: string, dto: UpdateEncounterDto): Promise<EncounterOutputDto> {
    const encounter = await this.encounterRepository.findById(id);

    if (!encounter) {
      throw new NotFoundException(`Encounter with ID ${id} not found`);
    }

    // Check if encounter is older than 24 hours
    const now = new Date();
    const encounterCreated = new Date((encounter as any).createdAt);
    const hoursSinceCreation = (now.getTime() - encounterCreated.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      throw new BadRequestException({
        code: 'ENCOUNTER_EDIT_WINDOW_EXPIRED',
        message: 'Cannot modify encounter. Edit window has expired (24 hours after creation).',
        details: {
          encounterId: id,
          createdAt: (encounter as any).createdAt,
          hoursSinceCreation: Math.floor(hoursSinceCreation),
          editWindowHours: 24,
          action: 'Contact hospital administrator for corrections.',
        },
      });
    }

    const updated = await this.encounterRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Encounter with ID ${id} not found`);
    }
    return this.mapToOutput(updated);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.encounterRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Encounter with ID ${id} not found`);
    }
  }

  private mapToOutput(item: any): EncounterOutputDto {
    return {
      id: item._id?.toString() || item.id,
      patientId: item.patientId,
      doctorId: item.doctorId?.toString() || item.doctorId,
      hospitalId: item.hospitalId?.toString() || item.hospitalId,
      visitReason: item.visitReason,
      diagnosis: item.diagnosis,
      prescriptions: item.prescriptions,
      vitals: item.vitals,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
