# API Documentation

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All endpoints except `/health` and patient verification require JWT authentication.

```
Authorization: Bearer <your_jwt_token>
```

## Localization

The API supports 3 languages: English (en), Hindi (hi), Gujarati (gu)

Set language via:

1. Query parameter: `?lang=hi`
2. Header: `Accept-Language: hi`
3. Custom header: `x-custom-lang: hi`

## 📋 Table of Contents

- [Authentication](#-authentication)
- [Patients](#-patients)
- [Doctors](#-doctors)
- [Hospitals](#-hospitals)
- [Appointments](#-appointments) ⭐ NEW
- [Prescriptions](#-prescriptions) ⭐ NEW
- [Encounters](#-encounters)
- [Health Documents](#-health-documents)
- [Consents](#-consents)

---

## 🔐 Authentication

### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "fullName": "John Doe",
  "role": "PATIENT",
  "phone": "+919876543210"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "PATIENT"
  }
}
```

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 👤 Patients

### Create Patient

```http
POST /patients
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fullName": "Raj Kumar",
  "email": "raj@example.com",
  "phone": "+919876543210",
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "bloodGroup": "O+",
  "address": "123 Main St, Mumbai"
}
```

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "guid": "NHRS-2025-A3B4C5D6",
  "fullName": "Raj Kumar",
  "email": "raj@example.com",
  "phone": "+919876543210",
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "bloodGroup": "O+",
  "createdAt": "2025-11-30T10:00:00.000Z"
}
```

### Search Patients

```http
GET /patients/search/Raj?page=1&limit=10
Authorization: Bearer <token>
```

Search by: GUID, full name, or phone number (case-insensitive, partial match)

### Get Patient by GUID

```http
GET /patients/guid/NHRS-2025-A3B4C5D6
Authorization: Bearer <token>
```

### Download Patient ID Card

```http
GET /patients/507f1f77bcf86cd799439011/id-card
Authorization: Bearer <token>
```

**Response:** PDF file download with QR code

### Verify Patient (Public - No Auth)

```http
GET /patients/verify/NHRS-2025-A3B4C5D6
```

**Response:**

```json
{
  "verified": true,
  "guid": "NHRS-2025-A3B4C5D6",
  "fullName": "Raj Kumar",
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "message": "Patient identity verified successfully"
}
```

---

## 👨‍⚕️ Doctors

### Create Doctor

```http
POST /doctors
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fullName": "Dr. Priya Sharma",
  "email": "priya@hospital.com",
  "phone": "+919876543210",
  "specialization": "Cardiology",
  "licenseNumber": "MH-123456",
  "hospitalId": "507f1f77bcf86cd799439015"
}
```

### Search Doctors

```http
GET /doctors/search/Cardiology?hospitalId=507f1f77bcf86cd799439015&page=1&limit=10
Authorization: Bearer <token>
```

Search by: Specialization, name, or license number

### Get Doctors by Hospital

```http
GET /doctors/hospital/507f1f77bcf86cd799439015
Authorization: Bearer <token>
```

---

## 🏥 Hospitals

### Create Hospital

```http
POST /hospitals
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "name": "Apollo Hospital",
  "address": "456 Health St, Mumbai",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "phone": "+912212345678",
  "email": "contact@apollo.com"
}
```

### List All Hospitals

```http
GET /hospitals?page=1&limit=10
Authorization: Bearer <token>
```

---

## 📅 Appointments

### Create Appointment

```http
POST /appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "NHRS-2025-A3B4C5D6",
  "doctorId": "507f1f77bcf86cd799439011",
  "hospitalId": "507f1f77bcf86cd799439012",
  "appointmentType": "consultation",
  "priority": "routine",
  "appointmentDate": "2025-12-25",
  "startTime": "10:00",
  "endTime": "10:30",
  "reasonForVisit": "Regular checkup and blood pressure monitoring",
  "symptoms": "Mild headache, occasional dizziness",
  "notes": "Patient prefers morning appointments"
}
```

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439020",
  "patientId": "NHRS-2025-A3B4C5D6",
  "doctorId": "507f1f77bcf86cd799439011",
  "hospitalId": "507f1f77bcf86cd799439012",
  "status": "proposed",
  "appointmentType": "consultation",
  "priority": "routine",
  "appointmentDate": "2025-12-25T00:00:00.000Z",
  "startTime": "10:00",
  "endTime": "10:30",
  "durationMinutes": 30,
  "reasonForVisit": "Regular checkup and blood pressure monitoring",
  "doctorStatus": "needs-action",
  "createdAt": "2025-12-06T10:00:00.000Z"
}
```

### List Appointments

```http
GET /appointments?status=booked&doctorId=507f1f77bcf86cd799439011&page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**

- `patientId` - Filter by patient
- `doctorId` - Filter by doctor
- `hospitalId` - Filter by hospital
- `status` - Filter by status (proposed, booked, cancelled, etc.)
- `appointmentType` - Filter by type
- `startDate` - From date (YYYY-MM-DD)
- `endDate` - To date (YYYY-MM-DD)
- `page` - Page number
- `limit` - Items per page

### Get Upcoming Appointments

```http
GET /appointments/upcoming/NHRS-2025-A3B4C5D6
Authorization: Bearer <token>
```

Returns all future appointments for a patient (next 30 days)

### Get Doctor Schedule

```http
GET /appointments/doctor-schedule/507f1f77bcf86cd799439011?date=2025-12-20
Authorization: Bearer <token>
```

Returns all appointments for a doctor on a specific date

### Update Appointment

```http
PATCH /appointments/507f1f77bcf86cd799439020
Authorization: Bearer <token>
Content-Type: application/json

{
  "appointmentDate": "2025-12-26",
  "startTime": "11:00",
  "endTime": "11:30",
  "status": "booked",
  "doctorStatus": "accepted"
}
```

### Cancel Appointment

```http
POST /appointments/507f1f77bcf86cd799439020/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "cancellationReason": "Patient requested reschedule due to emergency"
}
```

### Check-In Patient

```http
POST /appointments/507f1f77bcf86cd799439020/check-in
Authorization: Bearer <admin_token>
```

Marks patient as checked-in (Admin/Doctor only)

### Fulfill Appointment

```http
POST /appointments/507f1f77bcf86cd799439020/fulfill
Authorization: Bearer <doctor_token>
Content-Type: application/json

{
  "encounterId": "507f1f77bcf86cd799439030"
}
```

Marks appointment as completed

### Mark No-Show

```http
POST /appointments/507f1f77bcf86cd799439020/no-show
Authorization: Bearer <admin_token>
```

**Appointment Statuses:**

- `proposed` - Initial request
- `pending` - Awaiting confirmation
- `booked` - Confirmed
- `arrived` - Patient arrived
- `checked-in` - Patient checked in
- `fulfilled` - Completed
- `cancelled` - Cancelled
- `noshow` - Patient didn't show up
- `waitlist` - On waiting list

**Appointment Types:**

- `consultation` - Regular consultation
- `follow-up` - Follow-up visit
- `emergency` - Emergency appointment
- `routine-checkup` - Routine health checkup
- `vaccination` - Vaccination
- `lab-test` - Lab test
- `surgery` - Surgical procedure
- `telemedicine` - Virtual consultation

**📖 Full documentation:** [APPOINTMENT_API.md](./APPOINTMENT_API.md)

---

## 💊 Prescriptions

### Create Prescription

```http
POST /prescriptions
Authorization: Bearer <doctor_token>
Content-Type: application/json

{
  "patientGuid": "patient-guid-123",
  "patient": "507f1f77bcf86cd799439011",
  "prescriber": "507f1f77bcf86cd799439012",
  "prescriberName": "Dr. Arun Kumar",
  "medicationName": "Amoxicillin",
  "genericName": "Amoxicillin",
  "form": "tablet",
  "strength": "500mg",
  "dosageInstruction": [
    {
      "sequence": 1,
      "text": "Take 1 tablet three times daily after meals for 7 days",
      "route": "oral",
      "timing": "after-meal",
      "doseQuantityValue": 1,
      "doseQuantityUnit": "tablet",
      "frequencyValue": 3,
      "frequencyPeriod": 1,
      "frequencyPeriodUnit": "day",
      "durationValue": 7,
      "durationUnit": "day"
    }
  ],
  "courseOfTherapy": "acute",
  "reasonText": "Bacterial throat infection",
  "authoredOn": "2024-12-06T10:30:00Z",
  "dispenseRequest": {
    "numberOfRepeatsAllowed": 0,
    "quantityValue": 21,
    "quantityUnit": "tablets"
  }
}
```

**Response:** `201 Created`

```json
{
  "_id": "507f1f77bcf86cd799439025",
  "prescriptionNumber": "RX-2024-000123",
  "status": "active",
  "medicationName": "Amoxicillin",
  "strength": "500mg",
  "dispensedCount": 0,
  "refillsRemaining": 0,
  "isExpired": false,
  "interactions": [],
  "createdAt": "2024-12-06T10:30:00Z"
}
```

### Get Prescriptions (with filters)

```http
GET /prescriptions?patient=507f1f77bcf86cd799439011&status=active&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**

- `patient` - Filter by patient ID
- `patientGuid` - Filter by patient ABDM GUID
- `prescriber` - Filter by doctor ID
- `encounter` - Filter by encounter ID
- `status` - active | completed | cancelled | stopped | on-hold
- `medicationName` - Search medication (partial match)
- `isControlledSubstance` - Filter controlled substances
- `isExpired` - Show only expired
- `hasRefillsAvailable` - Show only with refills
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### Get Active Prescriptions for Patient

```http
GET /prescriptions/patient/507f1f77bcf86cd799439011/active
Authorization: Bearer <token>
```

### Get Prescriptions Needing Refill

```http
GET /prescriptions/patient/507f1f77bcf86cd799439011/needing-refill
Authorization: Bearer <token>
```

### Get Prescription by Number

```http
GET /prescriptions/number/RX-2024-000123
Authorization: Bearer <token>
```

### Mark Prescription as Dispensed

```http
POST /prescriptions/507f1f77bcf86cd799439025/dispense
Authorization: Bearer <pharmacist_token>
```

### Cancel Prescription

```http
POST /prescriptions/507f1f77bcf86cd799439025/cancel
Authorization: Bearer <doctor_token>
Content-Type: application/json

{
  "reason": "Patient reported allergic reaction"
}
```

### Search Prescriptions by Medication

```http
GET /prescriptions/search?q=amoxicillin&limit=20
Authorization: Bearer <token>
```

**Prescription Status Workflow:**

```
draft → active → [on-hold] → completed
                ↓
            cancelled / stopped
```

**Prescription Features:**

- ✅ FHIR R6 compliant (MedicationRequest resource)
- ✅ Drug interaction checking
- ✅ Controlled substance tracking (DEA schedules)
- ✅ Refill management with automatic tracking
- ✅ Prescription expiry enforcement
- ✅ Digital signature support (e-prescription)
- ✅ ABDM integration ready (patient GUID)

**📖 Full documentation:** [PRESCRIPTION_API.md](./PRESCRIPTION_API.md)

---

## 📋 Encounters

### Create Encounter

```http
POST /encounters
Authorization: Bearer <doctor_token>
Content-Type: application/json

{
  "patientId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439012",
  "hospitalId": "507f1f77bcf86cd799439015",
  "encounterType": "Consultation",
  "chiefComplaint": "Chest pain and shortness of breath",
  "diagnosis": "Suspected angina pectoris",
  "prescription": "Aspirin 75mg daily, Atorvastatin 20mg at night",
  "notes": "Patient advised for ECG and cardiac enzyme tests"
}
```

### Search Encounters

```http
GET /encounters/search/advanced?patientId=507f1f77bcf86cd799439011&startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer <token>
```

**Query Parameters:**

- `patientId` - Filter by patient
- `doctorId` - Filter by doctor
- `hospitalId` - Filter by hospital
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `diagnosis` - Search in diagnosis text

### Update Encounter (24-hour window)

```http
PATCH /encounters/507f1f77bcf86cd799439020
Authorization: Bearer <doctor_token>
Content-Type: application/json

{
  "diagnosis": "Confirmed stable angina",
  "prescription": "Updated medication plan"
}
```

**Note:** Encounters can only be edited within 24 hours of creation

---

## 🤝 Consents

### Grant Consent

```http
POST /consents
Authorization: Bearer <patient_token>
Content-Type: application/json

{
  "patientId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439012",
  "scope": ["medical_history", "prescriptions", "lab_reports"],
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

### Hospital-wide Consent

```http
POST /consents
Authorization: Bearer <patient_token>
Content-Type: application/json

{
  "patientId": "507f1f77bcf86cd799439011",
  "hospitalId": "507f1f77bcf86cd799439015",
  "scope": ["full"],
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

### Emergency Override (3-step process)

#### Step 1: Request OTP

```http
POST /consents/emergency/request-otp
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "adminId": "507f1f77bcf86cd799439013"
}
```

#### Step 2: Verify OTP

```http
POST /consents/emergency/verify-otp
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "adminId": "507f1f77bcf86cd799439013",
  "otp": "123456"
}
```

#### Step 3: Create Override

```http
POST /consents/emergency/override
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "patientId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439012",
  "adminId": "507f1f77bcf86cd799439013",
  "justification": "Patient brought unconscious to ER. Requires immediate medical history for life-saving treatment.",
  "otp": "123456"
}
```

### Revoke Consent

```http
DELETE /consents/507f1f77bcf86cd799439014
Authorization: Bearer <patient_token>
```

---

## 📄 Health Documents

### Upload Document

```http
POST /health-documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

patientId: 507f1f77bcf86cd799439011
documentType: lab_report
title: Blood Test Results
description: Complete blood count
file: [binary file data]
```

### Get Document

```http
GET /health-documents/507f1f77bcf86cd799439030
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439030",
  "patientId": "507f1f77bcf86cd799439011",
  "documentType": "lab_report",
  "title": "Blood Test Results",
  "s3Key": "documents/507f1f77bcf86cd799439011/blood-test.pdf",
  "downloadUrl": "https://s3.amazonaws.com/...",
  "uploadedAt": "2025-11-30T10:00:00.000Z"
}
```

---

## 📊 Audit Logs

### Get Audit Logs

```http
GET /audit-logs?page=1&limit=10
Authorization: Bearer <admin_token>
```

**Query Parameters:**

- `userId` - Filter by user
- `action` - Filter by action (e.g., CREATE, UPDATE, DELETE)
- `resource` - Filter by resource (e.g., patient, encounter)
- `startDate` - Start date
- `endDate` - End date

---

## 🏥 Health Check

### System Health

```http
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  },
  "details": {
    "database": { "status": "up" }
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Validation error",
  "errors": ["email must be a valid email", "password must be at least 8 characters"]
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "CONSENT_REQUIRED",
  "error": "Patient consent required. Please obtain consent before accessing medical records."
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "PATIENT_NOT_FOUND",
  "error": "Not Found"
}
```

### 429 Too Many Requests

```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded. Please try again later.",
  "error": "Too Many Requests"
}
```

---

## Rate Limits

- **Global:** 100 requests per minute
- **Auth endpoints:** 5 requests per minute
- **Search endpoints:** 30 requests per minute

---

## Pagination

All list endpoints support pagination:

```http
GET /patients?page=2&limit=20
```

**Response format:**

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## Notifications

Enhanced multi-channel notification system with user preferences and delivery tracking.

### Features

✅ **34 Notification Types** - Appointments, Prescriptions, Lab Results, Consents, Security Alerts
✅ **Multi-Channel Delivery** - In-app, Email, SMS, Push Notifications, Webhooks
✅ **Smart Delivery** - User preferences, Quiet hours, Scheduled sending
✅ **Interactive Notifications** - Action buttons, Deep links, Rich content
✅ **Delivery Tracking** - Per-channel status, Retry mechanism, Failure logging

### Create Notification

```http
POST /api/v1/notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "prescription_expiring",
  "priority": "high",
  "recipientId": "507f1f77bcf86cd799439011",
  "title": "Prescription Expiring Soon",
  "message": "Your prescription for Amoxicillin will expire in 3 days.",
  "channels": ["in_app", "email", "sms"],
  "actions": [{
    "label": "Renew Now",
    "action": "renew_prescription",
    "style": "primary"
  }]
}
```

**Notification Types:**

- Appointments: `appointment_reminder`, `appointment_confirmed`, `appointment_cancelled`, `appointment_rescheduled`
- Prescriptions: `prescription_expiring`, `prescription_refill_due`, `prescription_dispensed`
- Lab Results: `lab_result_available`, `lab_result_critical`
- System: `system_alert`, `system_maintenance`, `security_alert`

**Priority Levels:** `low`, `normal`, `high`, `critical`

**Channels:** `in_app`, `email`, `sms`, `push`, `webhook`

### Get My Notifications

```http
GET /api/v1/notifications/me/unread?limit=50
Authorization: Bearer <token>
```

### Mark as Read

```http
POST /api/v1/notifications/{id}/mark-read
Authorization: Bearer <token>
```

### Manage Preferences

```http
GET /api/v1/notifications/preferences/me
Authorization: Bearer <token>
```

```http
PATCH /api/v1/notifications/preferences/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true,
  "preferredChannels": ["in_app", "email"],
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00",
    "excludeTypes": ["security_alert", "lab_result_critical"]
  },
  "enableGrouping": true
}
```

### Bulk Operations

```http
POST /api/v1/notifications/bulk
Authorization: Bearer <token>

{
  "recipientIds": ["id1", "id2", "id3"],
  "type": "system_maintenance",
  "priority": "normal",
  "title": "Maintenance Notice",
  "message": "System will be down for maintenance.",
  "channels": ["in_app", "email"]
}
```

**Complete Documentation:** See [NOTIFICATION_API.md](./NOTIFICATION_API.md) for detailed API reference with all 20 endpoints.

---

## Swagger Documentation

Interactive API documentation available at:

```
http://localhost:3000/api/docs
```

Features:

- Try out API endpoints directly
- View request/response schemas
- Authentication testing
- Code generation for multiple languages
