import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PatientRepository } from './patient.repository';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientOutputDto } from './dto/patient-output.dto';
import { PaginatedResponse, createPaginatedResponse } from '../../pagination.dto';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PatientService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'photos');

  constructor(private readonly patientRepository: PatientRepository) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

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

  /**
   * Advanced patient search by GUID, name, or phone
   * Supports partial matching and case-insensitive search
   */
  async search(
    searchTerm: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<PatientOutputDto>> {
    const currentPage = Math.max(1, Number(page) || 1);
    const itemsPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * itemsPerPage;

    // Build search query - search across multiple fields
    const searchQuery = {
      $or: [
        { guid: { $regex: searchTerm, $options: 'i' } },
        { fullName: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    const [items, total] = await Promise.all([
      this.patientRepository.search(searchQuery, skip, itemsPerPage),
      this.patientRepository.countByQuery(searchQuery),
    ]);

    const data = items.map((item) => this.mapToOutput(item));
    return createPaginatedResponse(data, total, currentPage, itemsPerPage);
  }

  /**
   * Find patient by GUID (exact match)
   */
  async findByGuid(guid: string): Promise<PatientOutputDto> {
    const item = await this.patientRepository.findByGuid(guid);
    if (!item) {
      throw new NotFoundException(`Patient with GUID ${guid} not found`);
    }
    return this.mapToOutput(item);
  }

  async findOne(id: string): Promise<PatientOutputDto> {
    let item = null;

    // Check if ID looks like a MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    if (isObjectId) {
      // Try to find by MongoDB ObjectId
      item = await this.patientRepository.findById(id);
    }

    // If not found (or ID wasn't an ObjectId), try GUID
    if (!item) {
      item = await this.patientRepository.findByGuid(id);
    }

    if (!item) {
      throw new NotFoundException(`Patient with ID or GUID ${id} not found`);
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

  /**
   * Upload patient profile photo
   */
  async uploadPhoto(id: string, file: Express.Multer.File): Promise<{ photoUrl: string }> {
    // Find patient by ID or GUID
    let patient = null;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    if (isObjectId) {
      patient = await this.patientRepository.findById(id);
    }
    if (!patient) {
      patient = await this.patientRepository.findByGuid(id);
    }
    if (!patient) {
      throw new NotFoundException(`Patient with ID or GUID ${id} not found`);
    }

    // Get actual MongoDB ID for update
    const patientId = (patient as any)._id.toString();

    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file format. Only JPEG and PNG are allowed.');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit.');
    }

    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const fileName = `${patientId}-${Date.now()}${fileExt}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Delete old photo if exists
    const existingPatient = patient as any;
    if (existingPatient.photoUrl) {
      const oldFileName = existingPatient.photoUrl.split('/').pop();
      const oldFilePath = path.join(this.uploadDir, oldFileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Update patient record with photo URL
    const photoUrl = `/uploads/photos/${fileName}`;
    await this.patientRepository.update(patientId, { photoUrl } as any);

    return { photoUrl };
  }

  /**
   * Delete patient profile photo
   */
  async deletePhoto(id: string): Promise<void> {
    // Find patient by ID or GUID
    let patient = null;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    if (isObjectId) {
      patient = await this.patientRepository.findById(id);
    }
    if (!patient) {
      patient = await this.patientRepository.findByGuid(id);
    }
    if (!patient) {
      throw new NotFoundException(`Patient with ID or GUID ${id} not found`);
    }

    // Get actual MongoDB ID for update
    const patientId = (patient as any)._id.toString();

    const existingPatient = patient as any;
    if (existingPatient.photoUrl) {
      const fileName = existingPatient.photoUrl.split('/').pop();
      const filePath = path.join(this.uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Clear photo URL from patient record
      await this.patientRepository.update(patientId, { photoUrl: null } as any);
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
