import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HospitalRepository } from './hospital.repository';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { HospitalOutputDto } from './dto/hospital-output.dto';
import { PaginatedResponse, createPaginatedResponse } from '../../pagination.dto';
import { Doctor, DoctorDocument } from '../doctor/schemas/doctor.schema';
import { User, UserDocument } from '../../auth/schemas/user.schema';

@Injectable()
export class HospitalService {
  constructor(
    private readonly hospitalRepository: HospitalRepository,
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

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

  /**
   * Remove (deactivate) hospital with cascade checks
   * Cannot delete if active doctors or hospital admins exist
   */
  async remove(id: string): Promise<void> {
    const hospital = await this.hospitalRepository.findById(id);
    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }

    // Check for active doctors
    const activeDoctorsCount = await this.doctorModel.countDocuments({
      hospitalId: new Types.ObjectId(id),
      isActive: true,
    });

    if (activeDoctorsCount > 0) {
      throw new BadRequestException({
        code: 'HOSPITAL_HAS_ACTIVE_DOCTORS',
        message: `Cannot delete hospital. ${activeDoctorsCount} active doctor(s) are associated with this hospital.`,
        details: {
          hospitalId: id,
          hospitalName: hospital.name,
          activeDoctorsCount,
          action: 'Please deactivate all doctors before deleting the hospital.',
        },
      });
    }

    // Check for hospital admins
    const hospitalAdminsCount = await this.userModel.countDocuments({
      hospitalId: new Types.ObjectId(id),
      role: 'HospitalAdmin',
      isActive: true,
    });

    if (hospitalAdminsCount > 0) {
      throw new BadRequestException({
        code: 'HOSPITAL_HAS_ACTIVE_ADMINS',
        message: `Cannot delete hospital. ${hospitalAdminsCount} hospital admin(s) are associated with this hospital.`,
        details: {
          hospitalId: id,
          hospitalName: hospital.name,
          hospitalAdminsCount,
          action: 'Please deactivate all hospital admins before deleting the hospital.',
        },
      });
    }

    // Safe to delete - no active dependencies
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
