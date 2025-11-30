import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogRepository } from './audit-log.repository';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { AuditLogOutputDto } from './dto/audit-log-output.dto';
import { PaginatedResponse, createPaginatedResponse } from '../../pagination.dto';

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLogOutputDto> {
    const created = await this.auditLogRepository.create(dto);
    return this.mapToOutput(created);
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResponse<AuditLogOutputDto>> {
    // Pagination defaults: page 1, limit 10, max 100
    const currentPage = Math.max(1, Number(page) || 1);
    const itemsPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const [items, total] = await Promise.all([
      this.auditLogRepository.findAll(skip, itemsPerPage),
      this.auditLogRepository.count(),
    ]);

    const data = items.map((item) => this.mapToOutput(item));
    return createPaginatedResponse(data, total, currentPage, itemsPerPage);
  }

  async findOne(id: string): Promise<AuditLogOutputDto> {
    const item = await this.auditLogRepository.findById(id);
    if (!item) {
      throw new NotFoundException(`AuditLog with ID ${id} not found`);
    }
    return this.mapToOutput(item);
  }

  async update(id: string, dto: UpdateAuditLogDto): Promise<AuditLogOutputDto> {
    const updated = await this.auditLogRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`AuditLog with ID ${id} not found`);
    }
    return this.mapToOutput(updated);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.auditLogRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`AuditLog with ID ${id} not found`);
    }
  }

  private mapToOutput(item: any): AuditLogOutputDto {
    return {
      id: item._id?.toString() || item.id,
      userId: item.userId,
      action: item.action,
      resource: item.resource,
      resourceId: item.resourceId,
      ipAddress: item.ipAddress,
      details: item.details,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
