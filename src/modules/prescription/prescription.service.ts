import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Prescription,
  PrescriptionDocument,
  PrescriptionStatus,
} from './schemas/prescription.schema';
import { PrescriptionRepository } from './prescription.repository';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionFilterDto } from './dto/prescription-filter.dto';

@Injectable()
export class PrescriptionService {
  private readonly logger = new Logger(PrescriptionService.name);

  constructor(
    @InjectModel(Prescription.name) private prescriptionModel: Model<PrescriptionDocument>,
    private readonly prescriptionRepository: PrescriptionRepository,
  ) {}

  /**
   * Generate unique prescription number
   * Format: RX-YYYY-NNNNNN
   */
  private async generatePrescriptionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RX-${year}-`;

    // Find the last prescription number for this year
    const lastPrescription = await this.prescriptionModel
      .findOne({
        prescriptionNumber: new RegExp(`^${prefix}`),
      })
      .sort({ prescriptionNumber: -1 })
      .select('prescriptionNumber')
      .exec();

    let nextNumber = 1;
    if (lastPrescription) {
      const parts = lastPrescription.prescriptionNumber.split('-');
      const lastNumber = parseInt(parts[2] ?? '0', 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  /**
   * Validate prescription business rules
   */
  private validatePrescription(dto: CreatePrescriptionDto): void {
    const authoredDate = new Date(dto.authoredOn);
    const now = new Date();

    // Cannot create prescription with future date
    if (authoredDate > now) {
      throw new BadRequestException('Prescription cannot be dated in the future');
    }

    // Validate effective period
    if (dto.effectivePeriodStart && dto.effectivePeriodEnd) {
      const start = new Date(dto.effectivePeriodStart);
      const end = new Date(dto.effectivePeriodEnd);
      if (end <= start) {
        throw new BadRequestException('Effective end date must be after start date');
      }
    }

    // Validate dispense request
    if (dto.dispenseRequest) {
      const { validityPeriodStart, validityPeriodEnd, numberOfRepeatsAllowed } =
        dto.dispenseRequest;

      if (validityPeriodStart && validityPeriodEnd) {
        const start = new Date(validityPeriodStart);
        const end = new Date(validityPeriodEnd);
        if (end <= start) {
          throw new BadRequestException('Prescription validity end date must be after start date');
        }
      }

      // Controlled substances have stricter refill limits
      if (dto.isControlledSubstance && numberOfRepeatsAllowed && numberOfRepeatsAllowed > 5) {
        throw new BadRequestException('Controlled substances cannot have more than 5 refills');
      }
    }

    // Validate dosage instructions
    if (dto.dosageInstruction.length === 0) {
      throw new BadRequestException('At least one dosage instruction is required');
    }

    // Check for duplicate sequences in dosage instructions
    const sequences = dto.dosageInstruction.map((d) => d.sequence);
    const uniqueSequences = new Set(sequences);
    if (sequences.length !== uniqueSequences.size) {
      throw new BadRequestException('Dosage instruction sequences must be unique');
    }
  }

  /**
   * Check for potential drug interactions
   * (In production, this should query a drug interaction database)
   */
  private async checkDrugInteractions(
    patientId: string,
    newMedicationName: string,
  ): Promise<string[]> {
    // Get active prescriptions for the patient
    const activePrescriptions = await this.prescriptionRepository.findActiveByPatient(patientId);

    const interactions: string[] = [];

    // Simplified interaction check (in production, use a drug interaction API/database)
    const knownInteractions: Record<string, string[]> = {
      warfarin: ['aspirin', 'ibuprofen', 'naproxen'],
      metformin: ['alcohol', 'contrast dye'],
      sildenafil: ['nitroglycerin', 'isosorbide'],
      // Add more interactions from a comprehensive database
    };

    const newMedLower = newMedicationName.toLowerCase();

    for (const prescription of activePrescriptions) {
      const existingMedLower = prescription.medicationName.toLowerCase();

      // Check if new med interacts with existing
      if (knownInteractions[newMedLower]?.includes(existingMedLower)) {
        interactions.push(
          `Potential interaction between ${newMedicationName} and ${prescription.medicationName}`,
        );
      }

      // Check reverse
      if (knownInteractions[existingMedLower]?.includes(newMedLower)) {
        interactions.push(
          `Potential interaction between ${prescription.medicationName} and ${newMedicationName}`,
        );
      }
    }

    return interactions;
  }

  /**
   * Create a new prescription
   */
  async create(createDto: CreatePrescriptionDto, _userId: string): Promise<PrescriptionDocument> {
    this.logger.log(`Creating prescription for patient ${createDto.patientGuid}`);

    // Validate business rules
    this.validatePrescription(createDto);

    // Generate unique prescription number
    const prescriptionNumber = await this.generatePrescriptionNumber();

    // Check for drug interactions
    const interactions = await this.checkDrugInteractions(
      createDto.patient,
      createDto.medicationName,
    );

    // Prepare prescription data
    const prescriptionData: any = {
      ...createDto,
      prescriptionNumber,
      statusChanged: new Date(),
    };

    // Add detected interactions
    if (interactions.length > 0) {
      prescriptionData.interactions = [...(createDto.interactions || []), ...interactions];
    }

    // Set validity period defaults if not provided
    if (prescriptionData.dispenseRequest && !prescriptionData.dispenseRequest.validityPeriodStart) {
      prescriptionData.dispenseRequest.validityPeriodStart = new Date();
    }

    if (prescriptionData.dispenseRequest && !prescriptionData.dispenseRequest.validityPeriodEnd) {
      // Default: 1 year validity for regular prescriptions, 30 days for controlled substances
      const validityDays = createDto.isControlledSubstance ? 30 : 365;
      const validityEnd = new Date();
      validityEnd.setDate(validityEnd.getDate() + validityDays);
      prescriptionData.dispenseRequest.validityPeriodEnd = validityEnd;
    }

    const prescription = new this.prescriptionModel(prescriptionData);
    await prescription.save();

    this.logger.log(`Prescription created: ${prescriptionNumber}`);

    return prescription;
  }

  /**
   * Find all prescriptions with filters
   */
  async findAll(filters: PrescriptionFilterDto) {
    return this.prescriptionRepository.findWithFilters(filters);
  }

  /**
   * Find prescription by ID
   */
  async findOne(id: string): Promise<PrescriptionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid prescription ID');
    }

    const prescription = await this.prescriptionModel
      .findOne({ _id: id, isDeleted: false })
      .populate('patient', 'name email phone guid')
      .populate('prescriber', 'name specialization licenseNumber')
      .populate('organization', 'name address contact')
      .populate('encounter')
      .exec();

    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${id} not found`);
    }

    return prescription;
  }

  /**
   * Find prescription by prescription number
   */
  async findByPrescriptionNumber(prescriptionNumber: string): Promise<any> {
    const prescription =
      await this.prescriptionRepository.findByPrescriptionNumber(prescriptionNumber);

    if (!prescription) {
      throw new NotFoundException(`Prescription with number ${prescriptionNumber} not found`);
    }

    return prescription;
  }

  /**
   * Update prescription
   */
  async update(
    id: string,
    updateDto: UpdatePrescriptionDto,
    userId: string,
  ): Promise<PrescriptionDocument> {
    const prescription = await this.findOne(id);

    // Cannot update completed or cancelled prescriptions
    if (['completed', 'cancelled', 'stopped'].includes(prescription.status)) {
      throw new BadRequestException(
        `Cannot update prescription with status ${prescription.status}`,
      );
    }

    // Track status changes
    if (updateDto.status && updateDto.status !== prescription.status) {
      prescription.statusChanged = new Date();
    }

    // Validate update
    if (updateDto.dosageInstruction) {
      const sequences = updateDto.dosageInstruction.map((d) => d.sequence);
      const uniqueSequences = new Set(sequences);
      if (sequences.length !== uniqueSequences.size) {
        throw new BadRequestException('Dosage instruction sequences must be unique');
      }
    }

    Object.assign(prescription, updateDto);
    await prescription.save();

    this.logger.log(`Prescription ${id} updated by user ${userId}`);

    return prescription;
  }

  /**
   * Cancel a prescription
   */
  async cancel(id: string, reason: string, userId: string): Promise<PrescriptionDocument> {
    const prescription = await this.findOne(id);

    if (prescription.status === PrescriptionStatus.CANCELLED) {
      throw new BadRequestException('Prescription is already cancelled');
    }

    if (prescription.status === PrescriptionStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed prescription');
    }

    prescription.status = PrescriptionStatus.CANCELLED;
    prescription.statusReason = reason;
    prescription.statusChanged = new Date();

    await prescription.save();

    this.logger.log(`Prescription ${id} cancelled by user ${userId}: ${reason}`);

    return prescription;
  }

  /**
   * Stop a prescription (different from cancel - used for therapeutic reasons)
   */
  async stop(id: string, reason: string, userId: string): Promise<PrescriptionDocument> {
    const prescription = await this.findOne(id);

    if (prescription.status === PrescriptionStatus.STOPPED) {
      throw new BadRequestException('Prescription is already stopped');
    }

    prescription.status = PrescriptionStatus.STOPPED;
    prescription.statusReason = reason;
    prescription.statusChanged = new Date();

    await prescription.save();

    this.logger.log(`Prescription ${id} stopped by user ${userId}: ${reason}`);

    return prescription;
  }

  /**
   * Mark prescription as dispensed
   */
  async markDispensed(id: string, userId: string): Promise<PrescriptionDocument> {
    const prescription = await this.findOne(id);

    if (prescription.status !== PrescriptionStatus.ACTIVE) {
      throw new BadRequestException('Only active prescriptions can be dispensed');
    }

    // Check if prescription is expired
    if (
      prescription.dispenseRequest?.validityPeriodEnd &&
      new Date() > prescription.dispenseRequest.validityPeriodEnd
    ) {
      throw new BadRequestException('Prescription has expired');
    }

    // Check if refills are available
    const refillsAllowed = prescription.dispenseRequest?.numberOfRepeatsAllowed || 0;
    if (prescription.dispensedCount >= refillsAllowed + 1) {
      throw new BadRequestException('No refills remaining');
    }

    await this.prescriptionRepository.incrementDispenseCount(id);

    const updated = await this.findOne(id);

    // If this was the last dispense, mark as completed
    if (updated.dispensedCount >= refillsAllowed + 1) {
      updated.status = PrescriptionStatus.COMPLETED;
      updated.statusChanged = new Date();
      await updated.save();
    }

    this.logger.log(`Prescription ${id} dispensed by user ${userId}`);

    return updated;
  }

  /**
   * Get active prescriptions for a patient
   */
  async getActiveForPatient(patientId: string) {
    return this.prescriptionRepository.findActiveByPatient(patientId);
  }

  /**
   * Get prescriptions for an encounter
   */
  async getByEncounter(encounterId: string) {
    return this.prescriptionRepository.findByEncounter(encounterId);
  }

  /**
   * Get expiring prescriptions (within next 7 days)
   */
  async getExpiringPrescriptions(daysAhead: number = 7) {
    return this.prescriptionRepository.findExpiringPrescriptions(daysAhead);
  }

  /**
   * Get prescriptions needing refill for a patient
   */
  async getNeedingRefill(patientId: string) {
    return this.prescriptionRepository.findNeedingRefill(patientId);
  }

  /**
   * Get prescription statistics for a patient
   */
  async getPatientStats(patientId: string) {
    return this.prescriptionRepository.getPatientPrescriptionStats(patientId);
  }

  /**
   * Search prescriptions by medication name
   */
  async searchByMedication(searchTerm: string, limit: number = 20) {
    return this.prescriptionRepository.searchByMedication(searchTerm, limit);
  }

  /**
   * Soft delete a prescription
   */
  async remove(id: string, userId: string): Promise<void> {
    const prescription = await this.findOne(id);

    // Can only delete draft or entered-in-error prescriptions
    if (
      ![PrescriptionStatus.DRAFT, PrescriptionStatus.ENTERED_IN_ERROR].includes(prescription.status)
    ) {
      throw new BadRequestException('Can only delete draft or entered-in-error prescriptions');
    }

    (prescription as any).isDeleted = true;
    await prescription.save();

    this.logger.log(`Prescription ${id} soft deleted by user ${userId}`);
  }
}
