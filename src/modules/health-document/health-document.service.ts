import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { HealthDocumentRepository } from './health-document.repository';
import { CreateHealthDocumentDto } from './dto/create-health-document.dto';
import { UpdateHealthDocumentDto } from './dto/update-health-document.dto';
import { HealthDocumentOutputDto } from './dto/health-document-output.dto';
import { PaginatedResponse, createPaginatedResponse } from '../../pagination.dto';

@Injectable()
export class HealthDocumentService {
  constructor(private readonly healthDocumentRepository: HealthDocumentRepository) {}

  async create(dto: CreateHealthDocumentDto): Promise<HealthDocumentOutputDto> {
    const createData: any = {
      ...dto,
      hospitalId: new Types.ObjectId(dto.hospitalId),
      ...(dto.encounterId && { encounterId: new Types.ObjectId(dto.encounterId) }),
    };
    const created = await this.healthDocumentRepository.create(createData);
    return this.mapToOutput(created);
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<HealthDocumentOutputDto>> {
    // Pagination defaults: page 1, limit 10, max 100
    const currentPage = Math.max(1, Number(page) || 1);
    const itemsPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const [items, total] = await Promise.all([
      this.healthDocumentRepository.findAll(skip, itemsPerPage),
      this.healthDocumentRepository.count(),
    ]);

    const data = items.map((item) => this.mapToOutput(item));
    return createPaginatedResponse(data, total, currentPage, itemsPerPage);
  }

  async findOne(id: string): Promise<HealthDocumentOutputDto> {
    const item = await this.healthDocumentRepository.findById(id);
    if (!item) {
      throw new NotFoundException(`HealthDocument with ID ${id} not found`);
    }
    return this.mapToOutput(item);
  }

  async update(id: string, dto: UpdateHealthDocumentDto): Promise<HealthDocumentOutputDto> {
    const updated = await this.healthDocumentRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`HealthDocument with ID ${id} not found`);
    }
    return this.mapToOutput(updated);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.healthDocumentRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`HealthDocument with ID ${id} not found`);
    }
  }

  private mapToOutput(item: any): HealthDocumentOutputDto {
    return {
      id: item._id?.toString() || item.id,
      patientId: item.patientId,
      hospitalId: item.hospitalId?.toString() || item.hospitalId,
      encounterId: item.encounterId?.toString() || item.encounterId,
      docType: item.docType,
      fileUrl: item.fileUrl,
      metadata: item.metadata,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
