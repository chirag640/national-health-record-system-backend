import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

/**
 * Database Seeding Script
 *
 * This script seeds the database with comprehensive test data including:
 * - Test patient user with ID 69479521902b94eec821b4c1
 * - Hospital and Doctor records
 * - Sample appointments (upcoming and past)
 * - Sample prescriptions (active and expired)
 * - Sample notifications
 *
 * Usage:
 *   npm run seed          # Run seeding
 *   npm run seed --force  # Force reseed (clears existing data)
 *
 * ⚠️ WARNING: Only run this in development/staging environments!
 */

// ======================= CONSTANTS =======================
const TEST_USER_ID = '69479521902b94eec821b4c1';
const TEST_PATIENT_GUID = 'NHRS-2025-TEST001';
const TEST_HOSPITAL_ID = new Types.ObjectId();
const TEST_DOCTOR_ID = new Types.ObjectId();
const TEST_DOCTOR_USER_ID = new Types.ObjectId();

// ======================= HELPER FUNCTIONS =======================
function generateObjectId(): Types.ObjectId {
  return new Types.ObjectId();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatTime(hours: number, minutes: number = 0): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// ======================= SEED DATA GENERATORS =======================

function createTestUser(hashedPassword: string) {
  return {
    _id: new Types.ObjectId(TEST_USER_ID),
    email: 'testpatient@healthcare.com',
    passwordHash: hashedPassword,
    role: 'Patient',
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpiry: null,
    passwordResetToken: null,
    passwordResetExpiry: null,
    refreshTokenVersion: 0,
    failedLoginAttempts: 0,
    accountLockedUntil: null,
    lastLoginAt: new Date(),
    patientId: TEST_PATIENT_GUID,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createDoctorUser(hashedPassword: string) {
  return {
    _id: TEST_DOCTOR_USER_ID,
    email: 'doctor@healthcare.com',
    passwordHash: hashedPassword,
    role: 'Doctor',
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpiry: null,
    passwordResetToken: null,
    passwordResetExpiry: null,
    refreshTokenVersion: 0,
    failedLoginAttempts: 0,
    accountLockedUntil: null,
    lastLoginAt: new Date(),
    doctorId: TEST_DOCTOR_ID.toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createSuperAdmin(hashedPassword: string) {
  return {
    _id: generateObjectId(),
    email: 'admin@national-health-record-system.com',
    passwordHash: hashedPassword,
    role: 'SuperAdmin',
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpiry: null,
    passwordResetToken: null,
    passwordResetExpiry: null,
    refreshTokenVersion: 0,
    failedLoginAttempts: 0,
    accountLockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createTestPatient() {
  return {
    _id: generateObjectId(),
    guid: TEST_PATIENT_GUID,
    userId: new Types.ObjectId(TEST_USER_ID),
    fullName: 'Test Patient',
    email: 'testpatient@healthcare.com',
    phone: '+919876543210',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'Male',
    bloodGroup: 'O+',
    address: {
      street: '123 Health Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
    },
    emergencyContact: {
      name: 'Emergency Contact',
      relationship: 'Spouse',
      phone: '+919876543211',
    },
    allergies: ['Penicillin', 'Peanuts'],
    chronicConditions: ['Hypertension'],
    insuranceProvider: 'National Health Insurance',
    insurancePolicyNumber: 'NHI-2025-123456',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createTestHospital() {
  return {
    _id: TEST_HOSPITAL_ID,
    name: 'City General Hospital',
    registrationNumber: 'HOS-2025-001',
    email: 'info@citygeneralhospital.com',
    phone: '+912212345678',
    address: {
      street: '456 Medical Avenue',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400002',
      country: 'India',
    },
    type: 'General',
    accreditation: 'NABH',
    facilities: ['Emergency', 'ICU', 'Surgery', 'Pharmacy', 'Laboratory'],
    operatingHours: {
      monday: { open: '00:00', close: '23:59' },
      tuesday: { open: '00:00', close: '23:59' },
      wednesday: { open: '00:00', close: '23:59' },
      thursday: { open: '00:00', close: '23:59' },
      friday: { open: '00:00', close: '23:59' },
      saturday: { open: '00:00', close: '23:59' },
      sunday: { open: '00:00', close: '23:59' },
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createTestDoctor() {
  return {
    _id: TEST_DOCTOR_ID,
    userId: TEST_DOCTOR_USER_ID,
    fullName: 'Dr. Priya Sharma',
    email: 'doctor@healthcare.com',
    phone: '+919876543212',
    specialization: 'General Medicine',
    licenseNumber: 'MH-DOC-2020-12345',
    qualifications: ['MBBS', 'MD - Internal Medicine'],
    hospitalId: TEST_HOSPITAL_ID,
    consultationFee: 500,
    availableSlots: [
      { day: 'Monday', startTime: '09:00', endTime: '17:00' },
      { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
      { day: 'Thursday', startTime: '09:00', endTime: '17:00' },
      { day: 'Friday', startTime: '09:00', endTime: '17:00' },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createAppointments(): any[] {
  const now = new Date();
  const appointments: any[] = [];

  // 5 Upcoming appointments
  for (let i = 1; i <= 5; i++) {
    const appointmentDate = addDays(now, i * 2); // 2, 4, 6, 8, 10 days from now
    appointments.push({
      _id: generateObjectId(),
      patientId: TEST_PATIENT_GUID,
      doctorId: TEST_DOCTOR_ID,
      hospitalId: TEST_HOSPITAL_ID,
      status: i === 1 ? 'booked' : 'proposed',
      appointmentType: ['consultation', 'follow-up', 'routine-checkup', 'lab-test', 'consultation'][
        i - 1
      ],
      priority: 'routine',
      appointmentDate: appointmentDate,
      startTime: formatTime(9 + i),
      endTime: formatTime(9 + i, 30),
      durationMinutes: 30,
      reasonForVisit: [
        'Regular health checkup',
        'Follow-up for blood pressure',
        'Annual physical examination',
        'Blood test for cholesterol',
        'Consultation for headaches',
      ][i - 1],
      symptoms: ['None', 'Mild headache', 'None', 'None', 'Recurring headaches'][i - 1],
      notes: `Appointment ${i} - Upcoming`,
      patientInstructions: 'Please bring your previous medical records',
      doctorStatus: 'accepted',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 5 Past appointments
  for (let i = 1; i <= 5; i++) {
    const appointmentDate = addDays(now, -i * 7); // 7, 14, 21, 28, 35 days ago
    appointments.push({
      _id: generateObjectId(),
      patientId: TEST_PATIENT_GUID,
      doctorId: TEST_DOCTOR_ID,
      hospitalId: TEST_HOSPITAL_ID,
      status: i === 5 ? 'cancelled' : 'fulfilled',
      appointmentType: [
        'consultation',
        'follow-up',
        'routine-checkup',
        'consultation',
        'follow-up',
      ][i - 1],
      priority: 'routine',
      appointmentDate: appointmentDate,
      startTime: formatTime(10 + i),
      endTime: formatTime(10 + i, 30),
      durationMinutes: 30,
      reasonForVisit: [
        'Cold and fever symptoms',
        'Follow-up after medication',
        'Blood pressure monitoring',
        'Stomach pain consultation',
        'Cancelled - schedule conflict',
      ][i - 1],
      symptoms: ['Fever, cough', 'None', 'None', 'Stomach pain', 'N/A'][i - 1],
      notes: `Appointment ${i + 5} - Past`,
      checkInTime: i !== 5 ? appointmentDate : null,
      checkOutTime: i !== 5 ? addDays(appointmentDate, 0) : null,
      cancellationReason: i === 5 ? 'Patient requested cancellation' : null,
      cancellationDate: i === 5 ? addDays(appointmentDate, -1) : null,
      doctorStatus: 'accepted',
      createdAt: addDays(appointmentDate, -3),
      updatedAt: appointmentDate,
    });
  }

  return appointments;
}

function createPrescriptions(): any[] {
  const now = new Date();
  const prescriptions: any[] = [];

  // 3 Active prescriptions
  const activeMedications = [
    {
      name: 'Amlodipine',
      dose: 5,
      unit: 'mg',
      frequency: 'Once daily',
      duration: 30,
      instructions: 'Take in the morning with water',
      forCondition: 'Hypertension',
    },
    {
      name: 'Metformin',
      dose: 500,
      unit: 'mg',
      frequency: 'Twice daily',
      duration: 30,
      instructions: 'Take after meals',
      forCondition: 'Diabetes management',
    },
    {
      name: 'Vitamin D3',
      dose: 60000,
      unit: 'IU',
      frequency: 'Once weekly',
      duration: 60,
      instructions: 'Take with fatty food for better absorption',
      forCondition: 'Vitamin D deficiency',
    },
  ];

  activeMedications.forEach((med, index) => {
    const authoredDate = addDays(now, -10 - index * 5);
    prescriptions.push({
      _id: generateObjectId(),
      prescriptionNumber: `RX-2025-00000${index + 1}`,
      patient: TEST_PATIENT_GUID,
      prescriber: TEST_DOCTOR_ID,
      encounter: null,
      status: 'active',
      intent: 'order',
      priority: 'routine',
      medicationName: med.name,
      medicationCode: `MED-${1000 + index}`,
      authoredOn: authoredDate,
      effectivePeriodStart: authoredDate,
      effectivePeriodEnd: addDays(authoredDate, med.duration),
      dosageInstruction: [
        {
          sequence: 1,
          text: `${med.dose}${med.unit} ${med.frequency}. ${med.instructions}`,
          patientInstruction: med.instructions,
          route: 'oral',
          doseQuantityValue: med.dose,
          doseQuantityUnit: med.unit,
          frequencyPerDay: med.frequency.includes('Twice') ? 2 : 1,
        },
      ],
      dispenseRequest: {
        validityPeriodStart: authoredDate,
        validityPeriodEnd: addDays(authoredDate, med.duration),
        numberOfRepeatsAllowed: 2,
        quantity: med.duration,
        quantityUnit: 'tablets',
        expectedSupplyDuration: med.duration,
        expectedSupplyDurationUnit: 'days',
      },
      reasonCode: med.forCondition,
      notes: `Prescribed for ${med.forCondition}`,
      isControlledSubstance: false,
      hospitalId: TEST_HOSPITAL_ID,
      createdAt: authoredDate,
      updatedAt: authoredDate,
    });
  });

  // 2 Expired prescriptions
  const expiredMedications = [
    {
      name: 'Azithromycin',
      dose: 500,
      unit: 'mg',
      frequency: 'Once daily',
      duration: 5,
      instructions: 'Take 1 hour before or 2 hours after meals',
      forCondition: 'Bacterial infection',
    },
    {
      name: 'Omeprazole',
      dose: 20,
      unit: 'mg',
      frequency: 'Once daily',
      duration: 14,
      instructions: 'Take before breakfast',
      forCondition: 'Acid reflux',
    },
  ];

  expiredMedications.forEach((med, index) => {
    const authoredDate = addDays(now, -60 - index * 30);
    prescriptions.push({
      _id: generateObjectId(),
      prescriptionNumber: `RX-2025-00000${index + 4}`,
      patient: TEST_PATIENT_GUID,
      prescriber: TEST_DOCTOR_ID,
      encounter: null,
      status: 'completed',
      intent: 'order',
      priority: 'routine',
      medicationName: med.name,
      medicationCode: `MED-${2000 + index}`,
      authoredOn: authoredDate,
      effectivePeriodStart: authoredDate,
      effectivePeriodEnd: addDays(authoredDate, med.duration),
      dosageInstruction: [
        {
          sequence: 1,
          text: `${med.dose}${med.unit} ${med.frequency}. ${med.instructions}`,
          patientInstruction: med.instructions,
          route: 'oral',
          doseQuantityValue: med.dose,
          doseQuantityUnit: med.unit,
          frequencyPerDay: 1,
        },
      ],
      dispenseRequest: {
        validityPeriodStart: authoredDate,
        validityPeriodEnd: addDays(authoredDate, med.duration),
        numberOfRepeatsAllowed: 0,
        quantity: med.duration,
        quantityUnit: 'tablets',
        expectedSupplyDuration: med.duration,
        expectedSupplyDurationUnit: 'days',
      },
      reasonCode: med.forCondition,
      notes: `Prescribed for ${med.forCondition} - Course completed`,
      isControlledSubstance: false,
      hospitalId: TEST_HOSPITAL_ID,
      createdAt: authoredDate,
      updatedAt: addDays(authoredDate, med.duration),
    });
  });

  return prescriptions;
}

function createNotifications(): any[] {
  const now = new Date();
  const userId = new Types.ObjectId(TEST_USER_ID);

  return [
    {
      _id: generateObjectId(),
      recipientId: userId,
      type: 'appointment_reminder',
      priority: 'high',
      status: 'sent',
      title: 'Upcoming Appointment Reminder',
      body: 'You have an appointment with Dr. Priya Sharma tomorrow at 10:00 AM.',
      data: { appointmentId: 'upcoming-1', doctorName: 'Dr. Priya Sharma' },
      channels: ['in_app', 'push'],
      expiresAt: addDays(now, 7),
      createdAt: addDays(now, -1),
      updatedAt: addDays(now, -1),
    },
    {
      _id: generateObjectId(),
      recipientId: userId,
      type: 'prescription_refill_due',
      priority: 'normal',
      status: 'sent',
      title: 'Prescription Refill Due',
      body: 'Your Amlodipine prescription will run out in 5 days. Consider requesting a refill.',
      data: { prescriptionId: 'rx-1', medicationName: 'Amlodipine' },
      channels: ['in_app'],
      expiresAt: addDays(now, 14),
      createdAt: addDays(now, -2),
      updatedAt: addDays(now, -2),
    },
    {
      _id: generateObjectId(),
      recipientId: userId,
      type: 'appointment_confirmed',
      priority: 'normal',
      status: 'read',
      title: 'Appointment Confirmed',
      body: 'Your appointment with Dr. Priya Sharma has been confirmed for next week.',
      data: { appointmentId: 'upcoming-2' },
      channels: ['in_app', 'email'],
      readAt: addDays(now, -2),
      expiresAt: addDays(now, 30),
      createdAt: addDays(now, -3),
      updatedAt: addDays(now, -2),
    },
    {
      _id: generateObjectId(),
      recipientId: userId,
      type: 'lab_result_available',
      priority: 'high',
      status: 'sent',
      title: 'Lab Results Available',
      body: 'Your blood test results are now available. Please review them.',
      data: { labReportId: 'lab-123' },
      channels: ['in_app', 'push', 'email'],
      expiresAt: addDays(now, 30),
      createdAt: addDays(now, -5),
      updatedAt: addDays(now, -5),
    },
    {
      _id: generateObjectId(),
      recipientId: userId,
      type: 'generic',
      priority: 'low',
      status: 'read',
      title: 'Welcome to Healthcare System',
      body: 'Thank you for registering. Complete your profile for better healthcare management.',
      data: {},
      channels: ['in_app'],
      readAt: addDays(now, -10),
      expiresAt: addDays(now, 60),
      createdAt: addDays(now, -15),
      updatedAt: addDays(now, -10),
    },
  ];
}

function createHealthDocuments(): any[] {
  const now = new Date();

  return [
    {
      _id: generateObjectId(),
      patientId: TEST_PATIENT_GUID,
      hospitalId: TEST_HOSPITAL_ID,
      uploadedBy: new Types.ObjectId(TEST_USER_ID),
      documentType: 'lab_report',
      title: 'Complete Blood Count Report',
      description: 'Annual CBC test results',
      fileUrl: 'https://storage.example.com/documents/cbc-report-2025.pdf',
      fileName: 'cbc-report-2025.pdf',
      fileSize: 245678,
      mimeType: 'application/pdf',
      metadata: {
        labName: 'City General Hospital Lab',
        testDate: addDays(now, -30).toISOString(),
      },
      tags: ['blood-test', 'annual-checkup', '2025'],
      isActive: true,
      createdAt: addDays(now, -30),
      updatedAt: addDays(now, -30),
    },
    {
      _id: generateObjectId(),
      patientId: TEST_PATIENT_GUID,
      hospitalId: TEST_HOSPITAL_ID,
      uploadedBy: new Types.ObjectId(TEST_USER_ID),
      documentType: 'prescription',
      title: 'Prescription - January 2025',
      description: 'Monthly prescription for hypertension',
      fileUrl: 'https://storage.example.com/documents/prescription-jan-2025.pdf',
      fileName: 'prescription-jan-2025.pdf',
      fileSize: 123456,
      mimeType: 'application/pdf',
      metadata: {
        doctorName: 'Dr. Priya Sharma',
        prescriptionDate: addDays(now, -15).toISOString(),
      },
      tags: ['prescription', 'hypertension', '2025'],
      isActive: true,
      createdAt: addDays(now, -15),
      updatedAt: addDays(now, -15),
    },
  ];
}

// ======================= MAIN SEED FUNCTION =======================

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const connection = app.get<Connection>(getConnectionToken());

    // Check if seeding has already been done
    const userCount = await connection.collection('users').countDocuments();
    if (userCount > 0) {
      console.log('⚠️  Database already contains data. Use --force to override.');
      console.log(`   Current user count: ${userCount}`);

      if (!process.argv.includes('--force')) {
        console.log('   Skipping seed. Add --force flag to reseed anyway.');
        await app.close();
        return;
      }

      console.log('   --force detected. Clearing existing data...\n');
      // Clear all collections
      const collections = [
        'users',
        'patients',
        'doctors',
        'hospitals',
        'appointments',
        'prescriptions',
        'notifications',
        'healthdocuments',
      ];
      for (const col of collections) {
        try {
          await connection.collection(col).deleteMany({});
          console.log(`✅ Cleared ${col}`);
        } catch (e) {
          // Collection might not exist yet
        }
      }
    }

    const defaultPassword = 'Test@123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 1. Create users
    console.log('\n👤 Creating users...');
    const testUser = createTestUser(hashedPassword);
    const doctorUser = createDoctorUser(hashedPassword);
    const adminUser = createSuperAdmin(hashedPassword);

    await connection.collection('users').insertMany([testUser, doctorUser, adminUser]);
    console.log('✅ Users created:');
    console.log(`   - Test Patient: testpatient@healthcare.com (ID: ${TEST_USER_ID})`);
    console.log(`   - Doctor: doctor@healthcare.com`);
    console.log(`   - Admin: admin@national-health-record-system.com`);
    console.log(`   - Password for all: ${defaultPassword}`);

    // 2. Create hospital
    console.log('\n🏥 Creating hospital...');
    const hospital = createTestHospital();
    await connection.collection('hospitals').insertOne(hospital);
    console.log(`✅ Hospital created: ${hospital.name}`);

    // 3. Create doctor
    console.log('\n👨‍⚕️ Creating doctor...');
    const doctor = createTestDoctor();
    await connection.collection('doctors').insertOne(doctor);
    console.log(`✅ Doctor created: ${doctor.fullName}`);

    // 4. Create patient
    console.log('\n🧑‍🤝‍🧑 Creating patient...');
    const patient = createTestPatient();
    await connection.collection('patients').insertOne(patient);
    console.log(`✅ Patient created: ${patient.fullName} (GUID: ${patient.guid})`);

    // 5. Create appointments
    console.log('\n📅 Creating appointments...');
    const appointments = createAppointments();
    await connection.collection('appointments').insertMany(appointments);
    console.log(`✅ Created ${appointments.length} appointments (5 upcoming, 5 past)`);

    // 6. Create prescriptions
    console.log('\n💊 Creating prescriptions...');
    const prescriptions = createPrescriptions();
    await connection.collection('prescriptions').insertMany(prescriptions);
    console.log(`✅ Created ${prescriptions.length} prescriptions (3 active, 2 completed)`);

    // 7. Create notifications
    console.log('\n🔔 Creating notifications...');
    const notifications = createNotifications();
    await connection.collection('notifications').insertMany(notifications);
    console.log(`✅ Created ${notifications.length} notifications`);

    // 8. Create health documents
    console.log('\n📄 Creating health documents...');
    const healthDocs = createHealthDocuments();
    await connection.collection('healthdocuments').insertMany(healthDocs);
    console.log(`✅ Created ${healthDocs.length} health documents`);

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   ┌────────────────────────────────────────────────────┐');
    console.log('   │ Test Patient User                                   │');
    console.log(`   │   Email: testpatient@healthcare.com                │`);
    console.log(`   │   Password: ${defaultPassword}                          │`);
    console.log(`   │   User ID: ${TEST_USER_ID}          │`);
    console.log(`   │   Patient GUID: ${TEST_PATIENT_GUID}                   │`);
    console.log('   ├────────────────────────────────────────────────────┤');
    console.log('   │ Doctor User                                         │');
    console.log(`   │   Email: doctor@healthcare.com                      │`);
    console.log(`   │   Password: ${defaultPassword}                          │`);
    console.log('   ├────────────────────────────────────────────────────┤');
    console.log('   │ Super Admin User                                    │');
    console.log(`   │   Email: admin@national-health-record-system.com   │`);
    console.log(`   │   Password: ${defaultPassword}                          │`);
    console.log('   └────────────────────────────────────────────────────┘');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the application: npm run start:dev');
    console.log('   2. Login with test patient credentials');
    console.log('   3. Test the API endpoints: http://localhost:3000/api\n');
  } catch (error: any) {
    const err = error as Error;
    console.error('\n❌ Seeding failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Handle reset flag
if (process.argv.includes('--reset')) {
  console.log('🔄 Resetting database...');
  console.log('⚠️  This will delete ALL data!\n');
}

void seed();
