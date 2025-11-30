import { Injectable, NotFoundException } from '@nestjs/common';
import { PatientRepository } from './patient.repository';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientOutputDto } from './dto/patient-output.dto';
import { PaginatedResponse, createPaginatedResponse } from '../../pagination.dto';
import * as crypto from 'crypto';

@Injectable()
export class PatientService {
  constructor(private readonly patientRepository: PatientRepository) {}

  /**
   * Generate unique GUID for patient
   * Format: NHRS-YYYY-XXXXXXXX (e.g., NHRS-2025-A3B4C5D6)
   */
  private generateGUID(): string {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `NHRS-${year}-${randomHex}`;
  }

  async create(dto: CreatePatientDto): Promise<PatientOutputDto> {
    // Auto-generate GUID if not provided
    const patientData = {
      ...dto,
      guid: dto.guid || this.generateGUID(),
    };

    const created = await this.patientRepository.create(patientData);
    return this.mapToOutput(created);
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResponse<PatientOutputDto>> {
    // Pagination defaults: page 1, limit 10, max 100
    const currentPage = Math.max(1, Number(page) || 1);
    const itemsPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const [items, total] = await Promise.all([
      this.patientRepository.findAll(skip, itemsPerPage),
      this.patientRepository.count(),
    ]);

    const data = items.map((item) => this.mapToOutput(item));
    return createPaginatedResponse(data, total, currentPage, itemsPerPage);
  }

  async findOne(id: string): Promise<PatientOutputDto> {
    const item = await this.patientRepository.findById(id);
    if (!item) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }
    return this.mapToOutput(item);
  }

  async update(id: string, dto: UpdatePatientDto): Promise<PatientOutputDto> {
    const updated = await this.patientRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }
    return this.mapToOutput(updated);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.patientRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }
  }

  private mapToOutput(item: any): PatientOutputDto {
    return {
      id: item._id?.toString() || item.id,
      guid: item.guid,
      fullName: item.fullName,
      phone: item.phone,
      gender: item.gender,
      dateOfBirth: item.dateOfBirth,
      address: item.address,
      allergies: item.allergies,
      chronicDiseases: item.chronicDiseases,
      bloodGroup: item.bloodGroup,
      emergencyContact: item.emergencyContact,
      hasSmartphone: item.hasSmartphone,
      idCardIssued: item.idCardIssued,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
