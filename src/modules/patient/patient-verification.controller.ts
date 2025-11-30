import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient } from '../patient/schemas/patient.schema';

/**
 * Public verification endpoint for QR code scanning
 * No authentication required - used by hospital kiosks
 */
@ApiTags('Verification')
@Controller({ path: 'patients/verify', version: '1' })
export class PatientVerificationController {
  constructor(@InjectModel(Patient.name) private patientModel: Model<Patient>) {}

  @Get(':guid')
  @ApiOperation({
    summary: 'Verify patient GUID (Public endpoint)',
    description:
      'Scans QR code and verifies patient identity. Returns basic info without sensitive data. ' +
      'Used by hospital reception kiosks for patient check-in.',
  })
  async verifyPatient(@Param('guid') guid: string) {
    const patient = await this.patientModel
      .findOne({ guid })
      .select('guid fullName dateOfBirth gender');

    if (!patient) {
      throw new NotFoundException('Patient GUID not found');
    }

    return {
      verified: true,
      guid: patient.guid,
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      message: 'Patient identity verified successfully',
    };
  }
}
