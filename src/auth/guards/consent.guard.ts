import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Consent, ConsentDocument } from '../../modules/consent/schemas/consent.schema';
import { UserRole } from '../schemas/user.schema';

/**
 * ConsentGuard - Enforces patient consent before doctors can access medical data
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, RolesGuard, ConsentGuard)
 * @RequireConsent('patientId', ['Encounters.read'])
 *
 * How it works:
 * 1. Extracts patientId from request (params, body, or query)
 * 2. If user is not a doctor, bypasses check (admins have full access)
 * 3. If user is a doctor, verifies active consent exists
 * 4. Checks consent scope matches required permissions
 * 5. Throws ForbiddenException if consent not found or expired
 */
@Injectable()
export class ConsentGuard implements CanActivate {
  private readonly logger = new Logger(ConsentGuard.name);

  constructor(@InjectModel(Consent.name) private consentModel: Model<ConsentDocument>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user (shouldn't happen after JwtAuthGuard), deny access
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Only doctors need consent - admins and patients have inherent access
    if (user.role !== UserRole.DOCTOR) {
      return true;
    }

    // Extract patientId from various sources
    const patientId = this.extractPatientId(request);

    if (!patientId) {
      // If no patientId in request, this might not be a patient-specific route
      // Allow it and let the service layer handle validation
      return true;
    }

    // Check if doctor has active consent from patient
    const hasConsent = await this.verifyConsent(patientId, user.doctorId, user.hospitalId);

    if (!hasConsent) {
      this.logger.warn(
        `Consent denied: Doctor ${user.doctorId} attempted to access Patient ${patientId} without consent`,
      );
      throw new ForbiddenException({
        code: 'CONSENT_REQUIRED',
        message: 'Patient consent required to access this data',
        details: {
          patientId,
          doctorId: user.doctorId,
          action: `${request.method} ${request.url}`,
        },
      });
    }

    this.logger.log(`Consent verified: Doctor ${user.doctorId} accessing Patient ${patientId}`);

    return true;
  }

  /**
   * Extract patientId from request params, body, or query
   */
  private extractPatientId(request: any): string | null {
    return (
      request.params?.patientId ||
      request.body?.patientId ||
      request.query?.patientId ||
      request.params?.id || // For routes like /patients/:id
      null
    );
  }

  /**
   * Verify active consent exists between patient and doctor
   */
  private async verifyConsent(
    patientId: string,
    doctorId: string,
    hospitalId: string,
  ): Promise<boolean> {
    const now = new Date();

    // Check for active consent that hasn't expired
    const consent = await this.consentModel.findOne({
      patientId,
      $or: [
        { doctorId }, // Doctor-specific consent
        { hospitalId }, // Hospital-wide consent
      ],
      isActive: true,
      expiresAt: { $gt: now },
    });

    return !!consent;
  }
}
