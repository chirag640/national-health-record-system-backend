import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { Patient } from './schemas/patient.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PatientIdCardService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
    private configService: ConfigService,
  ) {}

  /**
   * Generate a PDF ID card for a patient with QR code
   * @param patientId - Patient's MongoDB ID
   * @returns PDF buffer
   */
  async generateIdCard(patientId: string): Promise<Buffer> {
    // Find patient
    const patient = await this.patientModel.findById(patientId).exec();
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Generate QR code data URL
    const qrData = await this.generateQRCode(patient.guid);

    // Create PDF
    return this.createPdfIdCard(patient, qrData);
  }

  /**
   * Generate QR code containing patient GUID and verification data
   * @param guid - Patient GUID
   * @returns QR code as data URL
   */
  private async generateQRCode(guid: string): Promise<string> {
    const qrPayload = {
      guid,
      issuer: 'National Health Record System',
      issuedAt: new Date().toISOString(),
      verifyUrl: `${this.configService.get('APP_URL')}/api/v1/patients/verify/${guid}`,
    };

    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 200,
      margin: 1,
    });

    return qrDataUrl;
  }

  /**
   * Create PDF document with patient ID card design
   * @param patient - Patient document
   * @param qrDataUrl - QR code data URL
   * @returns PDF buffer
   */
  private async createPdfIdCard(patient: any, qrDataUrl: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document (credit card size: 85.6mm x 53.98mm)
        const doc = new PDFDocument({
          size: [242.65, 153], // Convert mm to points (1mm = 2.834645669 points)
          margins: { top: 10, bottom: 10, left: 15, right: 15 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header - Government Emblem Area
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1a237e')
          .text('भारत सरकार | Government of India', 15, 15, { align: 'center' });

        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#333333')
          .text('National Health Record System', 15, 30, { align: 'center' });

        // Divider line
        doc.strokeColor('#1a237e').lineWidth(1).moveTo(15, 45).lineTo(227.65, 45).stroke();

        // Patient Photo Placeholder (left side)
        doc.rect(20, 55, 50, 60).strokeColor('#cccccc').lineWidth(1).stroke();
        doc.fontSize(7).fillColor('#999999').text('PHOTO', 32, 82, { width: 30, align: 'center' });

        // Patient Details (center)
        const detailsX = 80;
        let currentY = 55;

        doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
        doc.text('Name:', detailsX, currentY);
        doc.font('Helvetica').text(patient.fullName || 'N/A', detailsX + 40, currentY);
        currentY += 12;

        doc.font('Helvetica-Bold');
        doc.text('GUID:', detailsX, currentY);
        doc
          .font('Helvetica')
          .fillColor('#0d47a1')
          .text(patient.guid, detailsX + 40, currentY);
        currentY += 12;

        doc.font('Helvetica-Bold').fillColor('#333333');
        doc.text('DOB:', detailsX, currentY);
        doc
          .font('Helvetica')
          .text(
            patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-IN') : 'N/A',
            detailsX + 40,
            currentY,
          );
        currentY += 12;

        doc.font('Helvetica-Bold');
        doc.text('Gender:', detailsX, currentY);
        doc.font('Helvetica').text(patient.gender || 'N/A', detailsX + 40, currentY);
        currentY += 12;

        doc.font('Helvetica-Bold');
        doc.text('Blood:', detailsX, currentY);
        doc
          .font('Helvetica')
          .fillColor('#c62828')
          .text(patient.bloodGroup || 'Unknown', detailsX + 40, currentY);

        // QR Code (right side)
        const qrImageBase64 = qrDataUrl.split(',')[1]; // Remove data:image/png;base64, prefix
        if (qrImageBase64) {
          doc.image(Buffer.from(qrImageBase64, 'base64'), 175, 55, {
            width: 50,
            height: 50,
          });
        }

        doc
          .fontSize(6)
          .fillColor('#666666')
          .text('SCAN TO VERIFY', 172, 108, { width: 55, align: 'center' });

        // Footer
        doc
          .fontSize(6)
          .fillColor('#999999')
          .text(`Issued: ${new Date().toLocaleDateString('en-IN')} | Valid: Lifetime`, 15, 130, {
            align: 'center',
          });

        doc.fontSize(5).text('For medical use only. Report loss immediately.', 15, 140, {
          align: 'center',
        });

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
