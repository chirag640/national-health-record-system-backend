import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ConsentRepository } from './consent.repository';
import { CreateConsentDto } from './dto/create-consent.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { ConsentOutputDto } from './dto/consent-output.dto';
import { PaginatedResponse, createPaginatedResponse } from '../../pagination.dto';

@Injectable()
export class ConsentService {
  constructor(private readonly consentRepository: ConsentRepository) {}

  async create(dto: CreateConsentDto): Promise<ConsentOutputDto> {
    const createData: any = {
      ...dto,
      ...(dto.doctorId && { doctorId: new Types.ObjectId(dto.doctorId) }),
      ...(dto.hospitalId && { hospitalId: new Types.ObjectId(dto.hospitalId) }),
    };
    const created = await this.consentRepository.create(createData);
    return this.mapToOutput(created);
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResponse<ConsentOutputDto>> {
    // Pagination defaults: page 1, limit 10, max 100
    const currentPage = Math.max(1, Number(page) || 1);
    const itemsPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const [items, total] = await Promise.all([
      this.consentRepository.findAll(skip, itemsPerPage),
      this.consentRepository.count(),
    ]);

    const data = items.map((item) => this.mapToOutput(item));
    return createPaginatedResponse(data, total, currentPage, itemsPerPage);
  }

  async findOne(id: string): Promise<ConsentOutputDto> {
    const item = await this.consentRepository.findById(id);
    if (!item) {
      throw new NotFoundException(`Consent with ID ${id} not found`);
    }
    return this.mapToOutput(item);
  }

  async update(id: string, dto: UpdateConsentDto): Promise<ConsentOutputDto> {
    const updated = await this.consentRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Consent with ID ${id} not found`);
    }
    return this.mapToOutput(updated);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.consentRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Consent with ID ${id} not found`);
    }
  }

  private mapToOutput(item: any): ConsentOutputDto {
    return {
      id: item._id?.toString() || item.id,
      patientId: item.patientId,
      doctorId: item.doctorId?.toString() || item.doctorId,
      hospitalId: item.hospitalId?.toString() || item.hospitalId,
      scope: item.scope,
      expiresAt: item.expiresAt,
      isActive: item.isActive !== undefined ? item.isActive : true,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
