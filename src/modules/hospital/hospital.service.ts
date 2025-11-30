import { Injectable, NotFoundException } from '@nestjs/common';
import { HospitalRepository } from './hospital.repository';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { HospitalOutputDto } from './dto/hospital-output.dto';
import { PaginatedResponse, createPaginatedResponse } from '../../pagination.dto';

@Injectable()
export class HospitalService {
  constructor(private readonly hospitalRepository: HospitalRepository) {}

  async create(dto: CreateHospitalDto): Promise<HospitalOutputDto> {
    const created = await this.hospitalRepository.create(dto);
    return this.mapToOutput(created);
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResponse<HospitalOutputDto>> {
    // Pagination defaults: page 1, limit 10, max 100
    const currentPage = Math.max(1, Number(page) || 1);
    const itemsPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const [items, total] = await Promise.all([
      this.hospitalRepository.findAll(skip, itemsPerPage),
      this.hospitalRepository.count(),
    ]);

    const data = items.map((item) => this.mapToOutput(item));
    return createPaginatedResponse(data, total, currentPage, itemsPerPage);
  }

  async findOne(id: string): Promise<HospitalOutputDto> {
    const item = await this.hospitalRepository.findById(id);
    if (!item) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }
    return this.mapToOutput(item);
  }

  async update(id: string, dto: UpdateHospitalDto): Promise<HospitalOutputDto> {
    const updated = await this.hospitalRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }
    return this.mapToOutput(updated);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.hospitalRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }
  }

  private mapToOutput(item: any): HospitalOutputDto {
    return {
      id: item._id?.toString() || item.id,
      name: item.name,
      state: item.state,
      district: item.district,
      hospitalType: item.hospitalType,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
