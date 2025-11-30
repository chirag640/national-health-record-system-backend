import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findOne(id: string): Promise<EncounterOutputDto> {
    const item = await this.encounterRepository.findById(id);
    if (!item) {
      throw new NotFoundException(`Encounter with ID ${id} not found`);
    }
    return this.mapToOutput(item);
  }

  async update(id: string, dto: UpdateEncounterDto): Promise<EncounterOutputDto> {
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
