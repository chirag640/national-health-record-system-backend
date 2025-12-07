# Prescription Management API

## Overview

The Prescription Management System provides a comprehensive, FHIR-compliant solution for e-prescription management in healthcare facilities. This system supports the complete prescription lifecycle from creation to dispensing, with built-in safety features including drug interaction checking, controlled substance tracking, and prescription expiry management.

**Base URL**: `http://localhost:3000/api/v1/prescriptions`

**Authentication**: All endpoints require JWT Bearer token authentication.

---

## Features

✅ **FHIR R6 Compliant** - Based on MedicationRequest resource  
✅ **E-Prescription Support** - Digital signature and unique prescription numbers  
✅ **Drug Interaction Checking** - Automatic detection of potential interactions  
✅ **Controlled Substance Tracking** - DEA schedule management and audit trails  
✅ **Refill Management** - Automatic tracking of dispenses and refills  
✅ **Prescription Expiry** - Validity period enforcement  
✅ **Multi-dose Instructions** - Complex dosing regimens support  
✅ **Generic Substitution** - Configurable substitution policies  
✅ **ABDM Integration Ready** - Patient GUID support for India's health records

---

## Table of Contents

1. [Prescription Status Workflow](#prescription-status-workflow)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Usage Examples](#usage-examples)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

---

## Prescription Status Workflow

```
draft → active → [on-hold] → completed
                ↓
            cancelled
                ↓
              stopped
```

### Status Definitions

- **draft**: Prescription not yet finalized
- **active**: Prescription is valid and can be dispensed
- **on-hold**: Temporarily suspended (e.g., patient travel)
- **cancelled**: Cancelled before any dispenses
- **stopped**: Stopped after dispenses (therapeutic reasons)
- **completed**: All refills dispensed
- **entered-in-error**: Created by mistake
- **unknown**: Status unclear

---

## API Endpoints

### 1. Create Prescription

**POST** `/api/v1/prescriptions`

Creates a new prescription with automatic drug interaction checking.

**Authorization**: Doctor, Super Admin

**Request Body**:

```json
{
  "patientGuid": "patient-123-guid",
  "patient": "507f1f77bcf86cd799439011",
  "prescriber": "507f1f77bcf86cd799439012",
  "prescriberName": "Dr. Arun Kumar",
  "prescriberLicenseNumber": "MCI-12345",
  "organization": "507f1f77bcf86cd799439013",
  "encounter": "507f1f77bcf86cd799439014",
  "medicationName": "Amoxicillin",
  "genericName": "Amoxicillin",
  "form": "tablet",
  "strength": "500mg",
  "medicationCode": "SNOMED-27658006",
  "medicationCodeSystem": "SNOMED-CT",
  "dosageInstruction": [
    {
      "sequence": 1,
      "text": "Take 1 tablet three times daily after meals for 7 days",
      "patientInstruction": "Complete the full course even if you feel better",
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
  "additionalInstructions": "Take with plenty of water. Avoid alcohol.",
  "courseOfTherapy": "acute",
  "reasonText": "Bacterial throat infection",
  "authoredOn": "2024-12-06T10:30:00Z",
  "effectivePeriodStart": "2024-12-06T10:30:00Z",
  "effectivePeriodEnd": "2024-12-13T10:30:00Z",
  "dispenseRequest": {
    "validityPeriodStart": "2024-12-06T10:30:00Z",
    "validityPeriodEnd": "2025-12-06T10:30:00Z",
    "numberOfRepeatsAllowed": 0,
    "quantityValue": 21,
    "quantityUnit": "tablets",
    "expectedSupplyDurationValue": 7,
    "expectedSupplyDurationUnit": "day",
    "dispenserInstructions": "Dispense as written"
  },
  "substitution": {
    "allowed": true,
    "reason": "Generic equivalent available"
  },
  "warnings": ["May cause drowsiness"],
  "isControlledSubstance": false,
  "priority": "routine",
  "intent": "order",
  "status": "active"
}
```

**Response**: `201 Created`

```json
{
  "_id": "507f1f77bcf86cd799439015",
  "prescriptionNumber": "RX-2024-000123",
  "status": "active",
  "intent": "order",
  "priority": "routine",
  "patientGuid": "patient-123-guid",
  "patient": "507f1f77bcf86cd799439011",
  "prescriber": "507f1f77bcf86cd799439012",
  "prescriberName": "Dr. Arun Kumar",
  "medicationName": "Amoxicillin",
  "genericName": "Amoxicillin",
  "strength": "500mg",
  "dosageInstruction": [...],
  "dispensedCount": 0,
  "refillsRemaining": 0,
  "isExpired": false,
  "createdAt": "2024-12-06T10:30:00Z",
  "updatedAt": "2024-12-06T10:30:00Z"
}
```

---

### 2. Get All Prescriptions (with filters)

**GET** `/api/v1/prescriptions`

Retrieves prescriptions with optional filtering and pagination.

**Authorization**: Doctor, Patient, Super Admin, Hospital Admin

**Query Parameters**:

- `patient` (string): Filter by patient MongoDB ID
- `patientGuid` (string): Filter by patient ABDM GUID
- `prescriber` (string): Filter by doctor MongoDB ID
- `encounter` (string): Filter by encounter MongoDB ID
- `organization` (string): Filter by hospital MongoDB ID
- `status` (enum): Filter by status (active, completed, etc.)
- `priority` (enum): Filter by priority (routine, urgent, asap, stat)
- `medicationName` (string): Search medication name (partial match)
- `authoredOnStart` (ISO date): Start date for prescription date range
- `authoredOnEnd` (ISO date): End date for prescription date range
- `isControlledSubstance` (boolean): Filter controlled substances
- `isExpired` (boolean): Show only expired prescriptions
- `hasRefillsAvailable` (boolean): Show only prescriptions with refills
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `sortBy` (string, default: "authoredOn"): Sort field
- `sortOrder` (string, default: "desc"): Sort order (asc/desc)

**Example Request**:

```
GET /api/v1/prescriptions?patient=507f1f77bcf86cd799439011&status=active&page=1&limit=20
```

**Response**: `200 OK`

```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "prescriptionNumber": "RX-2024-000123",
      "status": "active",
      "medicationName": "Amoxicillin",
      "strength": "500mg",
      "prescriber": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Dr. Arun Kumar",
        "specialization": "General Practice"
      },
      "authoredOn": "2024-12-06T10:30:00Z",
      "dispensedCount": 0,
      "refillsRemaining": 0
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### 3. Get Active Prescriptions for Patient

**GET** `/api/v1/prescriptions/patient/:patientId/active`

Retrieves all active and on-hold prescriptions for a specific patient.

**Authorization**: Doctor, Patient (own only), Super Admin, Hospital Admin

**Response**: `200 OK`

```json
[
  {
    "_id": "507f1f77bcf86cd799439015",
    "prescriptionNumber": "RX-2024-000123",
    "status": "active",
    "medicationName": "Amoxicillin",
    "dosageInstruction": [...],
    "dispensedCount": 0,
    "refillsRemaining": 2,
    "isExpired": false
  }
]
```

---

### 4. Get Prescriptions Needing Refill

**GET** `/api/v1/prescriptions/patient/:patientId/needing-refill`

Retrieves prescriptions with 1 or fewer refills remaining.

**Authorization**: Doctor, Patient (own only), Super Admin, Hospital Admin

**Response**: `200 OK` - Array of prescriptions

---

### 5. Get Patient Prescription Statistics

**GET** `/api/v1/prescriptions/patient/:patientId/stats`

Get prescription statistics for a patient.

**Authorization**: Doctor, Patient (own only), Super Admin

**Response**: `200 OK`

```json
{
  "total": 25,
  "byStatus": {
    "active": 5,
    "completed": 18,
    "cancelled": 2
  }
}
```

---

### 6. Get Prescriptions for Encounter

**GET** `/api/v1/prescriptions/encounter/:encounterId`

Retrieves all prescriptions associated with a specific medical encounter.

**Authorization**: Doctor, Super Admin

**Response**: `200 OK` - Array of prescriptions

---

### 7. Get Expiring Prescriptions

**GET** `/api/v1/prescriptions/expiring?days=7`

Retrieves prescriptions expiring within specified days.

**Authorization**: Doctor, Super Admin, Hospital Admin

**Query Parameters**:

- `days` (number, default: 7): Days ahead to check

**Response**: `200 OK` - Array of prescriptions sorted by expiry date

---

### 8. Search Prescriptions by Medication

**GET** `/api/v1/prescriptions/search?q=amoxicillin&limit=20`

Full-text search for prescriptions by medication name.

**Authorization**: Doctor, Super Admin, Hospital Admin

**Query Parameters**:

- `q` (string, required): Search term
- `limit` (number, default: 20): Result limit

**Response**: `200 OK` - Array of matching prescriptions

---

### 9. Get Prescription by Number

**GET** `/api/v1/prescriptions/number/:prescriptionNumber`

Retrieve prescription by unique prescription number (e.g., RX-2024-000123).

**Authorization**: Doctor, Patient (if own), Super Admin, Hospital Admin

**Response**: `200 OK` - Full prescription details

---

### 10. Get Prescription by ID

**GET** `/api/v1/prescriptions/:id`

Retrieve prescription by MongoDB ID.

**Authorization**: Doctor, Patient (if own), Super Admin, Hospital Admin

**Response**: `200 OK` - Full prescription details with populated references

---

### 11. Update Prescription

**PATCH** `/api/v1/prescriptions/:id`

Update prescription details. Cannot update completed, cancelled, or stopped prescriptions.

**Authorization**: Doctor, Super Admin

**Request Body** (partial update):

```json
{
  "dosageInstruction": [...],
  "additionalInstructions": "Updated instructions",
  "status": "on-hold",
  "statusReason": "Patient traveling"
}
```

**Response**: `200 OK` - Updated prescription

---

### 12. Cancel Prescription

**POST** `/api/v1/prescriptions/:id/cancel`

Cancel a prescription before it's completed.

**Authorization**: Doctor, Super Admin

**Request Body**:

```json
{
  "reason": "Patient allergic reaction reported"
}
```

**Response**: `200 OK` - Cancelled prescription

**Business Rules**:

- Cannot cancel already completed prescriptions
- Status changes to "cancelled"
- Reason is required and logged

---

### 13. Stop Prescription

**POST** `/api/v1/prescriptions/:id/stop`

Stop a prescription for therapeutic reasons (different from cancel).

**Authorization**: Doctor, Super Admin

**Request Body**:

```json
{
  "reason": "Treatment no longer required - condition resolved"
}
```

**Response**: `200 OK` - Stopped prescription

---

### 14. Mark Prescription as Dispensed

**POST** `/api/v1/prescriptions/:id/dispense`

Record that medication has been dispensed. Increments dispense count and checks refill limits.

**Authorization**: Hospital Admin (Pharmacist role), Super Admin

**Response**: `200 OK` - Updated prescription with incremented dispense count

**Business Rules**:

- Only active prescriptions can be dispensed
- Checks prescription expiry
- Validates refills remaining
- Auto-completes when all refills used
- Updates `lastDispensedDate`

---

### 15. Delete Prescription (Soft Delete)

**DELETE** `/api/v1/prescriptions/:id`

Soft delete a prescription. Only draft or entered-in-error prescriptions can be deleted.

**Authorization**: Doctor, Super Admin

**Response**: `204 No Content`

---

## Data Models

### Prescription Schema

```typescript
{
  prescriptionNumber: string;        // Unique (RX-YYYY-NNNNNN)
  status: PrescriptionStatus;        // Workflow status
  statusReason?: string;             // Reason for status change
  statusChanged?: Date;              // Last status change date
  intent: PrescriptionIntent;        // order, plan, proposal, etc.
  priority: PrescriptionPriority;    // routine, urgent, asap, stat

  // Patient & Prescriber
  patientGuid: string;               // ABDM patient GUID
  patient: ObjectId;                 // Reference to Patient
  prescriber: ObjectId;              // Reference to Doctor
  prescriberName?: string;
  prescriberLicenseNumber?: string;
  organization?: ObjectId;           // Reference to Hospital
  encounter?: ObjectId;              // Reference to Encounter

  // Medication Details
  medicationName: string;            // Brand/generic name
  medicationCode?: string;           // SNOMED/RxNorm code
  medicationCodeSystem?: string;
  genericName?: string;
  manufacturer?: string;
  form?: string;                     // tablet, capsule, syrup, etc.
  strength?: string;                 // "500mg", "5mg/ml"

  // Dosage (array for complex regimens)
  dosageInstruction: DosageInstruction[];
  additionalInstructions?: string;

  // Clinical Context
  courseOfTherapy?: CourseOfTherapy; // acute, chronic, seasonal
  reasonCode?: string;
  reasonText?: string;
  reasonReference?: ObjectId[];

  // Dates
  authoredOn: Date;                  // When prescribed
  effectivePeriodStart?: Date;
  effectivePeriodEnd?: Date;

  // Dispense Request
  dispenseRequest?: {
    validityPeriodStart?: Date;
    validityPeriodEnd?: Date;
    numberOfRepeatsAllowed: number;  // Refills
    quantityValue?: number;
    quantityUnit?: string;
    expectedSupplyDurationValue?: number;
    expectedSupplyDurationUnit?: string;
    dispenser?: ObjectId;
    dispenserInstructions?: string;
  };

  // Substitution
  substitution?: {
    allowed: boolean;
    reason?: string;
  };

  // Safety & Compliance
  warnings?: string[];
  interactions?: string[];           // Auto-detected
  allergiesConsidered?: string[];
  isControlledSubstance: boolean;
  controlledSubstanceSchedule?: string; // "I" through "V"
  requiresPreauthorization: boolean;
  preauthorizationNumber?: string;

  // Tracking
  dispensedCount: number;
  lastDispensedDate?: Date;

  // Digital Signature
  digitalSignature?: string;
  signatureTimestamp?: Date;

  // Metadata
  metadata?: Map<string, any>;
  tags?: string[];

  // Virtuals
  isExpired: boolean;                // Computed
  refillsRemaining: number;          // Computed

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

### Dosage Instruction Schema

```typescript
{
  sequence: number;                  // Order
  text: string;                      // Human-readable
  patientInstruction?: string;       // Patient-friendly
  timing?: DosageTimingCode;         // morning, after-meal, etc.
  asNeededBoolean?: boolean;         // PRN flag
  asNeededFor?: string;              // "for pain"
  route: RouteOfAdministration;      // oral, IV, topical, etc.
  method?: string;                   // "swallow whole"

  doseQuantityValue: number;         // 500
  doseQuantityUnit: string;          // "mg"
  doseQuantityCode?: string;         // UCUM code

  rateQuantityValue?: number;        // For infusions
  rateQuantityUnit?: string;

  maxDosePerPeriod?: number;
  maxDosePerPeriodUnit?: string;

  durationValue?: number;            // 7
  durationUnit?: string;             // "day"

  frequencyValue?: number;           // 3
  frequencyPeriod?: number;          // 1
  frequencyPeriodUnit?: string;      // "day"
}
```

---

## Usage Examples

### Example 1: Simple Antibiotic Prescription

```json
{
  "patientGuid": "patient-guid-123",
  "patient": "507f1f77bcf86cd799439011",
  "prescriber": "507f1f77bcf86cd799439012",
  "medicationName": "Azithromycin",
  "strength": "500mg",
  "form": "tablet",
  "dosageInstruction": [
    {
      "sequence": 1,
      "text": "Take 1 tablet once daily for 3 days",
      "route": "oral",
      "doseQuantityValue": 1,
      "doseQuantityUnit": "tablet",
      "frequencyValue": 1,
      "frequencyPeriod": 1,
      "frequencyPeriodUnit": "day",
      "durationValue": 3,
      "durationUnit": "day"
    }
  ],
  "authoredOn": "2024-12-06T10:00:00Z",
  "dispenseRequest": {
    "quantityValue": 3,
    "quantityUnit": "tablets",
    "numberOfRepeatsAllowed": 0
  }
}
```

### Example 2: Chronic Medication with Refills

```json
{
  "patientGuid": "patient-guid-456",
  "patient": "507f1f77bcf86cd799439021",
  "prescriber": "507f1f77bcf86cd799439022",
  "medicationName": "Metformin",
  "strength": "500mg",
  "form": "tablet",
  "courseOfTherapy": "chronic",
  "dosageInstruction": [
    {
      "sequence": 1,
      "text": "Take 1 tablet twice daily with meals",
      "route": "oral",
      "timing": "with-meal",
      "doseQuantityValue": 1,
      "doseQuantityUnit": "tablet",
      "frequencyValue": 2,
      "frequencyPeriod": 1,
      "frequencyPeriodUnit": "day"
    }
  ],
  "authoredOn": "2024-12-06T10:00:00Z",
  "dispenseRequest": {
    "quantityValue": 60,
    "quantityUnit": "tablets",
    "expectedSupplyDurationValue": 30,
    "expectedSupplyDurationUnit": "day",
    "numberOfRepeatsAllowed": 11,
    "validityPeriodEnd": "2025-12-06T10:00:00Z"
  },
  "substitution": {
    "allowed": true,
    "reason": "Cost savings with generic"
  }
}
```

### Example 3: PRN (As Needed) Medication

```json
{
  "patientGuid": "patient-guid-789",
  "patient": "507f1f77bcf86cd799439031",
  "prescriber": "507f1f77bcf86cd799439032",
  "medicationName": "Ibuprofen",
  "strength": "400mg",
  "form": "tablet",
  "dosageInstruction": [
    {
      "sequence": 1,
      "text": "Take 1-2 tablets every 6-8 hours as needed for pain",
      "route": "oral",
      "asNeededBoolean": true,
      "asNeededFor": "pain",
      "doseQuantityValue": 1,
      "doseQuantityUnit": "tablet",
      "maxDosePerPeriod": 6,
      "maxDosePerPeriodUnit": "day"
    }
  ],
  "warnings": ["Do not exceed 6 tablets in 24 hours", "Take with food"],
  "authoredOn": "2024-12-06T10:00:00Z"
}
```

### Example 4: Controlled Substance

```json
{
  "patientGuid": "patient-guid-101",
  "patient": "507f1f77bcf86cd799439041",
  "prescriber": "507f1f77bcf86cd799439042",
  "medicationName": "Tramadol",
  "strength": "50mg",
  "form": "capsule",
  "isControlledSubstance": true,
  "controlledSubstanceSchedule": "IV",
  "dosageInstruction": [
    {
      "sequence": 1,
      "text": "Take 1-2 capsules every 4-6 hours as needed for pain",
      "route": "oral",
      "asNeededBoolean": true,
      "asNeededFor": "pain",
      "doseQuantityValue": 1,
      "doseQuantityUnit": "capsule",
      "maxDosePerPeriod": 8,
      "maxDosePerPeriodUnit": "day"
    }
  ],
  "warnings": ["May cause drowsiness", "Do not drive or operate machinery"],
  "authoredOn": "2024-12-06T10:00:00Z",
  "dispenseRequest": {
    "quantityValue": 20,
    "quantityUnit": "capsules",
    "numberOfRepeatsAllowed": 0,
    "validityPeriodEnd": "2025-01-05T10:00:00Z"
  },
  "substitution": {
    "allowed": false,
    "reason": "Controlled substance - no substitution"
  }
}
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Prescription cannot be dated in the future",
  "error": "Bad Request"
}
```

#### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Prescription with ID 507f1f77bcf86cd799439015 not found",
  "error": "Not Found"
}
```

#### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Cannot update prescription with status completed",
  "error": "Conflict"
}
```

### Validation Errors

```json
{
  "statusCode": 400,
  "message": [
    "medicationName must be longer than or equal to 2 characters",
    "dosageInstruction must contain at least 1 elements"
  ],
  "error": "Bad Request"
}
```

---

## Best Practices

### 1. Prescription Creation

✅ **DO**:

- Always validate patient allergies before prescribing
- Include clear, patient-friendly dosage instructions
- Set appropriate validity periods (30 days for controlled substances, 1 year for regular)
- Use standard medication codes (SNOMED-CT, RxNorm) when available
- Add warnings for common side effects
- Check for drug interactions (system auto-checks but verify critical ones)

❌ **DON'T**:

- Backdate prescriptions
- Create prescriptions without encounter context (except renewals)
- Exceed maximum refills for controlled substances (typically 5)
- Forget to specify route of administration

### 2. Refill Management

✅ **DO**:

- Set reasonable refill limits based on medication type
- Monitor prescriptions needing refill proactively
- Use the "needing-refill" endpoint for patient outreach
- Set appropriate validity periods

❌ **DON'T**:

- Allow unlimited refills for controlled substances
- Forget to update dispense count when dispensing

### 3. Controlled Substances

✅ **DO**:

- Mark `isControlledSubstance: true`
- Set appropriate DEA schedule
- Limit validity to 30 days
- Restrict refills (max 5, often 0)
- Maintain audit trail of all changes
- Require additional verification for dispensing

❌ **DON'T**:

- Allow generic substitution without explicit approval
- Extend validity beyond regulatory limits

### 4. Drug Interactions

✅ **DO**:

- Review system-detected interactions
- Override only with clinical justification
- Document why interaction risk is acceptable
- Consider patient's active medications

❌ **DON'T**:

- Ignore interaction warnings
- Fail to document override reasons

### 5. Prescription Status Management

✅ **DO**:

- Use "cancel" for prescriptions never dispensed
- Use "stop" for prescriptions being discontinued after dispense
- Provide clear reasons for status changes
- Update status promptly when circumstances change

❌ **DON'T**:

- Delete prescriptions (use soft delete only for errors)
- Change status without documenting reason

### 6. Performance Optimization

✅ **DO**:

- Use filters to narrow result sets
- Paginate large result sets
- Cache frequently accessed prescriptions
- Use indexes (patient, prescriber, authoredOn)
- Populate only needed references

❌ **DON'T**:

- Fetch all prescriptions without filters
- Ignore pagination
- Over-populate unnecessary references

### 7. Security & Compliance

✅ **DO**:

- Verify prescriber authorization before creation
- Enforce RBAC for all operations
- Log all prescription changes (audit trail)
- Encrypt sensitive data
- Validate digital signatures
- Maintain HIPAA/ABDM compliance

❌ **DON'T**:

- Allow patients to create prescriptions
- Skip authorization checks
- Store sensitive data unencrypted

---

## Regulatory Compliance

### India (ABDM)

- Patient GUID required for ABDM integration
- Digital signature support for e-prescriptions
- Audit trail for all changes
- Controlled substance tracking per Narcotic Drugs and Psychotropic Substances Act

### US (DEA)

- DEA schedule classification support
- Controlled substance prescribing limits
- Refill restrictions enforcement
- Prescription validity periods

### FHIR Compliance

- Based on FHIR R6 MedicationRequest resource
- Standard medication coding (SNOMED-CT, RxNorm)
- Interoperable data formats
- HL7 standards adherence

---

## Prescription Number Format

```
RX-YYYY-NNNNNN
```

- **RX**: Prefix for prescription
- **YYYY**: Year
- **NNNNNN**: Sequential 6-digit number (padded with zeros)

Example: `RX-2024-000123`

---

## Indexes

The following indexes are created for optimal query performance:

1. `{ patientGuid: 1, status: 1 }` - Patient prescriptions by status
2. `{ patient: 1, authoredOn: -1 }` - Patient prescriptions chronologically
3. `{ prescriber: 1, authoredOn: -1 }` - Doctor prescriptions chronologically
4. `{ encounter: 1 }` - Encounter prescriptions
5. `{ status: 1, authoredOn: -1 }` - Status-based queries
6. `{ prescriptionNumber: 1 }` - Unique prescription lookup (unique index)
7. `{ 'dispenseRequest.validityPeriodEnd': 1 }` - Expiry checks
8. Text index on `{ medicationName: 'text', genericName: 'text' }` - Search

---

## Support & Contact

For API issues or questions:

- **GitHub**: [Repository Issues](https://github.com/yourusername/healthcare-backend/issues)
- **Email**: support@yourhealthcare.com
- **Documentation**: Full OpenAPI/Swagger docs at `/api/docs`

---

**Version**: 1.0.0  
**Last Updated**: December 6, 2024  
**FHIR Version**: R6  
**Maintained By**: Healthcare Backend Team
