import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DoctorRepository } from './doctor.repository';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorOutputDto } from './dto/doctor-output.dto';
import { PaginatedResponse, createPaginatedResponse } from '../../pagination.dto';

@Injectable()
export class DoctorService {
  constructor(private readonly doctorRepository: DoctorRepository) {}

  async create(dto: CreateDoctorDto): Promise<DoctorOutputDto> {
    const createData: any = {
      ...dto,
      hospitalId: new Types.ObjectId(dto.hospitalId),
    };
    const created = await this.doctorRepository.create(createData);
    return this.mapToOutput(created);
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResponse<DoctorOutputDto>> {
    // Pagination defaults: page 1, limit 10, max 100
    const currentPage = Math.max(1, Number(page) || 1);
    const itemsPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const [items, total] = await Promise.all([
      this.doctorRepository.findAll(skip, itemsPerPage),
      this.doctorRepository.count(),
    ]);

    const data = items.map((item) => this.mapToOutput(item));
    return createPaginatedResponse(data, total, currentPage, itemsPerPage);
  }

  async findOne(id: string): Promise<DoctorOutputDto> {
    const item = await this.doctorRepository.findById(id);
    if (!item) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return this.mapToOutput(item);
  }

  async update(id: string, dto: UpdateDoctorDto): Promise<DoctorOutputDto> {
    const updated = await this.doctorRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return this.mapToOutput(updated);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.doctorRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
  }

  private mapToOutput(item: any): DoctorOutputDto {
    return {
      id: item._id?.toString() || item.id,
      hospitalId: item.hospitalId?.toString() || item.hospitalId,
      fullName: item.fullName,
      phone: item.phone,
      specialization: item.specialization,
      licenseNumber: item.licenseNumber,
      isActive: item.isActive !== undefined ? item.isActive : true,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
