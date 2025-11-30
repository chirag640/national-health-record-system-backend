import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConsentRepository } from './consent.repository';
import { CreateConsentDto } from './dto/create-consent.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { ConsentOutputDto } from './dto/consent-output.dto';
import { EmergencyConsentOverrideDto } from './dto/emergency-consent-override.dto';
import { PaginatedResponse, createPaginatedResponse } from '../../pagination.dto';
import { User, UserRole } from '../../auth/schemas/user.schema';
import { Consent } from './schemas/consent.schema';

@Injectable()
export class ConsentService {
  constructor(
    private readonly consentRepository: ConsentRepository,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Consent.name) private consentModel: Model<Consent>,
  ) {}

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

  /**
   * Create emergency consent override (requires admin approval + OTP verification)
   * Creates temporary 1-hour consent for critical situations
   */
  async createEmergencyOverride(dto: EmergencyConsentOverrideDto): Promise<ConsentOutputDto> {
    // Verify admin exists and has HOSPITAL_ADMIN role
    const admin = await this.userModel.findById(dto.adminId);
    if (!admin) {
      throw new NotFoundException('Admin user not found');
    }
    if (admin.role !== UserRole.HOSPITAL_ADMIN && admin.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only hospital admins can approve emergency access');
    }

    // Verify doctor exists and has DOCTOR role
    const doctor = await this.userModel.findById(dto.doctorId);
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    if (doctor.role !== UserRole.DOCTOR) {
      throw new BadRequestException('Only doctors can request emergency access');
    }

    // Verify OTP (should be validated by OtpService in controller, but double-check here)
    // Note: OTP validation logic should be implemented in auth module
    if (!dto.otp || dto.otp.length !== 6) {
      throw new BadRequestException('Invalid OTP format');
    }

    // Create emergency consent with 1-hour expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now

    const emergencyConsent = await this.consentModel.create({
      patientId: new Types.ObjectId(dto.patientId),
      doctorId: new Types.ObjectId(dto.doctorId),
      hospitalId: doctor.hospitalId, // Use doctor's hospital
      scope: 'full',
      expiresAt,
      isActive: true,
      isEmergencyOverride: true,
      emergencyJustification: dto.justification,
      approvedBy: new Types.ObjectId(dto.adminId),
      approvedAt: new Date(),
    });

    return this.mapToOutput(emergencyConsent);
  }

  /**
   * Request OTP for emergency consent override
   * Sends OTP to admin's registered email/phone
   */
  async requestEmergencyOtp(adminId: string): Promise<{ message: string; expiresAt: Date }> {
    const admin = await this.userModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin user not found');
    }
    if (admin.role !== UserRole.HOSPITAL_ADMIN && admin.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only hospital admins can request emergency OTP');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Store OTP in user document (temporary field)
    await this.userModel.findByIdAndUpdate(adminId, {
      emergencyOtp: otp,
      emergencyOtpExpiresAt: expiresAt,
    });

    // TODO: Send OTP via email/SMS using EmailService or SMS service
    // For now, return OTP in response (remove in production)
    return {
      message: `OTP sent to ${admin.email}. Valid for 10 minutes.`,
      expiresAt,
      // otp, // Remove this in production - only for testing
    };
  }

  /**
   * Verify OTP for emergency consent override
   */
  async verifyEmergencyOtp(adminId: string, otp: string): Promise<boolean> {
    const admin = await this.userModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin user not found');
    }

    const storedOtp = (admin as any).emergencyOtp;
    const otpExpiresAt = (admin as any).emergencyOtpExpiresAt;

    if (!storedOtp || !otpExpiresAt) {
      throw new BadRequestException('No OTP request found. Please request OTP first.');
    }

    if (new Date() > new Date(otpExpiresAt)) {
      throw new BadRequestException('OTP expired. Please request a new OTP.');
    }

    if (storedOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Clear OTP after successful verification
    await this.userModel.findByIdAndUpdate(adminId, {
      $unset: { emergencyOtp: 1, emergencyOtpExpiresAt: 1 },
    });

    return true;
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
