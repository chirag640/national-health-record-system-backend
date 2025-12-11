import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
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
  @ApiParam({ name: 'guid', description: 'Patient GUID from QR code (e.g., NHRS-2025-A3B4C5D6)' })
  @ApiResponse({
    status: 200,
    description: 'Patient verified successfully',
    schema: {
      properties: {
        verified: { type: 'boolean', example: true },
        guid: { type: 'string', example: 'NHRS-2025-A3B4C5D6' },
        fullName: { type: 'string', example: 'Rajesh Kumar' },
        dateOfBirth: { type: 'string', format: 'date', example: '1985-03-15' },
        gender: { type: 'string', example: 'Male' },
        message: { type: 'string', example: 'Patient identity verified successfully' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Patient GUID not found - invalid QR code' })
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
