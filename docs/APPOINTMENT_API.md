# Appointment Management API Documentation

## Overview

The Appointment Management System provides a complete, FHIR-compliant solution for scheduling and managing healthcare appointments. It supports the full appointment lifecycle from booking to completion.

## Features

✅ **FHIR-Compliant Status Workflow**

- Proposed → Pending → Booked → Arrived → Checked-In → Fulfilled
- Cancellation and No-Show handling
- Waitlist support

✅ **Conflict Detection**

- Prevents double-booking of doctor time slots
- Validates appointment times
- Checks date/time constraints

✅ **Comprehensive Management**

- Book, reschedule, and cancel appointments
- Check-in and check-out tracking
- Link appointments to encounters
- Doctor schedule management

✅ **Role-Based Access Control**

- Patients can book their own appointments
- Doctors can view their schedule
- Hospital admins have full access
- Proper authorization checks

---

## Appointment Statuses (FHIR Standard)

| Status             | Description                  | Who Can Set            |
| ------------------ | ---------------------------- | ---------------------- |
| `proposed`         | Initial appointment request  | Patient, Admin         |
| `pending`          | Awaiting doctor confirmation | System                 |
| `booked`           | Confirmed by all parties     | Doctor, Admin          |
| `arrived`          | Patient has arrived          | Reception, Admin       |
| `checked-in`       | Patient checked in, waiting  | Reception, Admin       |
| `fulfilled`        | Appointment completed        | Doctor, Admin          |
| `cancelled`        | Cancelled before start       | Patient, Doctor, Admin |
| `noshow`           | Patient did not arrive       | Reception, Admin       |
| `entered-in-error` | Created by mistake           | Admin                  |
| `waitlist`         | On waiting list              | Patient, Admin         |

---

## Appointment Types

- `consultation` - Regular doctor consultation
- `follow-up` - Follow-up visit after previous consultation
- `emergency` - Emergency appointment
- `routine-checkup` - Annual/routine health checkup
- `vaccination` - Vaccination appointment
- `lab-test` - Laboratory test appointment
- `surgery` - Surgical procedure
- `telemedicine` - Virtual consultation

---

## API Endpoints

### Base URL

```
http://localhost:3000/api/v1/appointments
```

All endpoints require JWT authentication token in the header:

```
Authorization: Bearer <your_jwt_token>
```

---

### 1. Create Appointment

**Endpoint:** `POST /api/v1/appointments`

**Description:** Book a new appointment

**Required Roles:** Patient, Doctor, HospitalAdmin

**Request Body:**

```json
{
  "patientId": "NHRS-2025-A3B4C5D6",
  "doctorId": "507f1f77bcf86cd799439011",
  "hospitalId": "507f1f77bcf86cd799439012",
  "appointmentType": "consultation",
  "priority": "routine",
  "appointmentDate": "2025-12-20",
  "startTime": "10:00",
  "endTime": "10:30",
  "reasonForVisit": "Regular checkup and blood pressure monitoring",
  "symptoms": "Mild headache, fatigue",
  "notes": "Patient prefers morning appointments",
  "patientInstructions": "Please arrive 10 minutes early. Bring previous test reports."
}
```

**Response:** `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439020",
  "patientId": "NHRS-2025-A3B4C5D6",
  "doctorId": "507f1f77bcf86cd799439011",
  "hospitalId": "507f1f77bcf86cd799439012",
  "status": "proposed",
  "appointmentType": "consultation",
  "priority": "routine",
  "appointmentDate": "2025-12-20T00:00:00.000Z",
  "startTime": "10:00",
  "endTime": "10:30",
  "durationMinutes": 30,
  "reasonForVisit": "Regular checkup and blood pressure monitoring",
  "symptoms": "Mild headache, fatigue",
  "doctorStatus": "needs-action",
  "createdAt": "2025-12-06T10:00:00.000Z",
  "updatedAt": "2025-12-06T10:00:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid data or past date
- `409 Conflict` - Time slot already booked

---

### 2. Get All Appointments (with Filters)

**Endpoint:** `GET /api/v1/appointments`

**Description:** List appointments with optional filters

**Required Roles:** Patient, Doctor, HospitalAdmin, SuperAdmin

**Query Parameters:**

- `patientId` (optional) - Filter by patient
- `doctorId` (optional) - Filter by doctor
- `hospitalId` (optional) - Filter by hospital
- `status` (optional) - Filter by status
- `appointmentType` (optional) - Filter by type
- `startDate` (optional) - Filter from date (ISO 8601)
- `endDate` (optional) - Filter to date (ISO 8601)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

**Example Request:**

```
GET /api/v1/appointments?doctorId=507f1f77bcf86cd799439011&status=booked&startDate=2025-12-01&page=1&limit=10
```

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439020",
      "patientId": "NHRS-2025-A3B4C5D6",
      "doctorId": "507f1f77bcf86cd799439011",
      "status": "booked",
      "appointmentDate": "2025-12-20T00:00:00.000Z",
      "startTime": "10:00",
      "endTime": "10:30",
      ...
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### 3. Get Appointment by ID

**Endpoint:** `GET /api/v1/appointments/:id`

**Description:** Get details of a specific appointment

**Required Roles:** Patient, Doctor, HospitalAdmin, SuperAdmin

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439020",
  "patientId": "NHRS-2025-A3B4C5D6",
  "doctorId": "507f1f77bcf86cd799439011",
  "status": "booked",
  ...
}
```

---

### 4. Get Upcoming Appointments

**Endpoint:** `GET /api/v1/appointments/upcoming/:patientId`

**Description:** Get all future appointments for a patient (next 30 days)

**Required Roles:** Patient, Doctor, HospitalAdmin, SuperAdmin

**Response:** `200 OK`

```json
[
  {
    "id": "507f1f77bcf86cd799439020",
    "appointmentDate": "2025-12-20T00:00:00.000Z",
    "startTime": "10:00",
    "status": "booked",
    ...
  },
  {
    "id": "507f1f77bcf86cd799439021",
    "appointmentDate": "2025-12-25T00:00:00.000Z",
    "startTime": "14:00",
    "status": "proposed",
    ...
  }
]
```

---

### 5. Get Doctor Schedule

**Endpoint:** `GET /api/v1/appointments/doctor-schedule/:doctorId?date=2025-12-20`

**Description:** Get all appointments for a doctor on a specific date

**Required Roles:** Doctor, HospitalAdmin, SuperAdmin

**Query Parameters:**

- `date` (required) - Date in YYYY-MM-DD format

**Response:** `200 OK`

```json
[
  {
    "id": "507f1f77bcf86cd799439020",
    "startTime": "09:00",
    "endTime": "09:30",
    "patientId": "NHRS-2025-A3B4C5D6",
    "status": "booked"
  },
  {
    "id": "507f1f77bcf86cd799439021",
    "startTime": "10:00",
    "endTime": "10:30",
    "patientId": "NHRS-2025-B7C8D9E0",
    "status": "booked"
  }
]
```

---

### 6. Update Appointment

**Endpoint:** `PATCH /api/v1/appointments/:id`

**Description:** Update appointment details or reschedule

**Required Roles:** Patient, Doctor, HospitalAdmin, SuperAdmin

**Request Body:** (All fields optional)

```json
{
  "appointmentDate": "2025-12-21",
  "startTime": "11:00",
  "endTime": "11:30",
  "status": "booked",
  "doctorStatus": "accepted",
  "notes": "Updated notes"
}
```

**Response:** `200 OK`

---

### 7. Cancel Appointment

**Endpoint:** `POST /api/v1/appointments/:id/cancel`

**Description:** Cancel an appointment with a reason

**Required Roles:** Patient, Doctor, HospitalAdmin

**Request Body:**

```json
{
  "cancellationReason": "Patient requested reschedule due to personal emergency"
}
```

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439020",
  "status": "cancelled",
  "cancellationReason": "Patient requested reschedule due to personal emergency",
  "cancellationDate": "2025-12-06T10:30:00.000Z",
  ...
}
```

---

### 8. Check-In Patient

**Endpoint:** `POST /api/v1/appointments/:id/check-in`

**Description:** Mark patient as checked-in

**Required Roles:** Doctor, HospitalAdmin

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439020",
  "status": "checked-in",
  "checkInTime": "2025-12-20T09:55:00.000Z",
  ...
}
```

---

### 9. Fulfill Appointment

**Endpoint:** `POST /api/v1/appointments/:id/fulfill`

**Description:** Mark appointment as completed

**Required Roles:** Doctor, HospitalAdmin

**Request Body:** (Optional)

```json
{
  "encounterId": "507f1f77bcf86cd799439030"
}
```

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439020",
  "status": "fulfilled",
  "checkOutTime": "2025-12-20T10:35:00.000Z",
  "encounterId": "507f1f77bcf86cd799439030",
  ...
}
```

---

### 10. Mark No-Show

**Endpoint:** `POST /api/v1/appointments/:id/no-show`

**Description:** Mark appointment when patient does not arrive

**Required Roles:** Doctor, HospitalAdmin

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439020",
  "status": "noshow",
  ...
}
```

---

### 11. Delete Appointment

**Endpoint:** `DELETE /api/v1/appointments/:id`

**Description:** Soft delete an appointment (Admin only)

**Required Roles:** HospitalAdmin, SuperAdmin

**Response:** `204 No Content`

---

## Appointment Workflow Examples

### Example 1: Normal Appointment Flow

1. **Patient books appointment**

   ```
   POST /appointments
   Status: proposed, doctorStatus: needs-action
   ```

2. **Doctor/Admin confirms**

   ```
   PATCH /appointments/:id
   { "status": "booked", "doctorStatus": "accepted" }
   ```

3. **Patient arrives**

   ```
   POST /appointments/:id/check-in
   Status: checked-in
   ```

4. **Appointment completed**
   ```
   POST /appointments/:id/fulfill
   { "encounterId": "..." }
   Status: fulfilled
   ```

### Example 2: Cancellation Flow

1. **Patient requests cancellation**
   ```
   POST /appointments/:id/cancel
   { "cancellationReason": "Cannot attend due to work emergency" }
   Status: cancelled
   ```

### Example 3: No-Show Flow

1. **Patient doesn't arrive**
   ```
   POST /appointments/:id/no-show
   Status: noshow
   ```

---

## Business Rules

1. **Time Validation**
   - Appointment date must be in the future
   - End time must be after start time
   - Cannot update past appointments (except to cancel)

2. **Conflict Prevention**
   - Doctor cannot have overlapping appointments
   - System checks for time conflicts before booking

3. **Status Transitions**
   - `proposed` → `booked` → `arrived` → `checked-in` → `fulfilled`
   - Can cancel from any status
   - Cannot change status backwards (except cancellation)

4. **Cancellation Rules**
   - Must provide cancellation reason
   - Cancellation timestamp recorded
   - Tracks who cancelled the appointment

5. **Update Restrictions**
   - Cannot update past appointments
   - Rescheduling checks for new time conflicts
   - Status changes must follow valid workflow

---

## Error Codes

| Code | Message                                | Cause                              |
| ---- | -------------------------------------- | ---------------------------------- |
| 400  | Appointment date must be in the future | Trying to book past date           |
| 400  | End time must be after start time      | Invalid time range                 |
| 400  | Cancellation reason required           | Cancelling without reason          |
| 400  | Cannot update past appointments        | Updating old appointment           |
| 404  | Appointment not found                  | Invalid appointment ID             |
| 409  | Time slot already booked               | Doctor has conflicting appointment |

---

## Integration Points

### With Encounters

- Link fulfilled appointments to encounters
- Create encounter during/after appointment

### With Notifications (Future)

- Send appointment reminders
- Notify on status changes
- Alert for upcoming appointments

### With Patient Records

- View patient appointment history
- Track no-show rates
- Analyze visit patterns

---

## Testing the API

### Using cURL

```bash
# 1. Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@national-health-record-system.com","password":"Admin@123456"}'

# 2. Create appointment
curl -X POST http://localhost:3000/api/v1/appointments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "NHRS-2025-A3B4C5D6",
    "doctorId": "507f1f77bcf86cd799439011",
    "hospitalId": "507f1f77bcf86cd799439012",
    "appointmentType": "consultation",
    "appointmentDate": "2025-12-25",
    "startTime": "10:00",
    "endTime": "10:30",
    "reasonForVisit": "Regular checkup"
  }'

# 3. Get all appointments
curl -X GET "http://localhost:3000/api/v1/appointments?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Check-in patient
curl -X POST http://localhost:3000/api/v1/appointments/:id/check-in \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Database Schema

### Appointment Collection

```typescript
{
  _id: ObjectId,
  patientId: String (ref: Patient.guid),
  doctorId: ObjectId (ref: Doctor),
  hospitalId: ObjectId (ref: Hospital),
  status: String (enum: AppointmentStatus),
  appointmentType: String (enum: AppointmentType),
  priority: String (enum: AppointmentPriority),
  appointmentDate: Date,
  startTime: String,
  endTime: String,
  durationMinutes: Number,
  reasonForVisit: String,
  symptoms: String (optional),
  notes: String (optional),
  patientInstructions: String (optional),
  cancellationReason: String (optional),
  cancellationDate: Date (optional),
  cancelledBy: ObjectId (optional),
  checkInTime: Date (optional),
  checkOutTime: Date (optional),
  doctorStatus: String (enum: ParticipantStatus),
  reminderSent: Boolean,
  reminderSentAt: Date (optional),
  encounterId: ObjectId (optional),
  metadata: Object (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `{ createdAt: -1 }` - Sort by creation
- `{ patientId: 1, appointmentDate: -1 }` - Patient appointments
- `{ doctorId: 1, appointmentDate: 1, startTime: 1 }` - Doctor schedule
- `{ hospitalId: 1, appointmentDate: 1 }` - Hospital appointments
- `{ status: 1, appointmentDate: 1 }` - Filter by status
- `{ appointmentType: 1, status: 1 }` - Type and status
- `{ reasonForVisit: 'text', symptoms: 'text' }` - Text search

---

## Future Enhancements

1. **Recurring Appointments**
   - Weekly/monthly recurring slots
   - Series management

2. **Waitlist Management**
   - Automatic notification when slots open
   - Priority-based slot allocation

3. **Doctor Availability Management**
   - Set weekly schedule
   - Block specific dates
   - Define slot durations

4. **Notification Integration**
   - SMS/Email reminders
   - Push notifications
   - Status change alerts

5. **Analytics**
   - No-show rates
   - Appointment statistics
   - Doctor utilization

---

## Production Checklist

✅ FHIR-compliant implementation
✅ Soft delete for data retention
✅ Comprehensive validation
✅ Conflict detection
✅ Role-based access control
✅ Audit logging ready
✅ Indexed for performance
✅ Error handling
✅ TypeScript type safety
✅ API documentation

---

## Support

For issues or questions:

- Check Swagger docs: http://localhost:3000/api/docs
- Review error messages
- Check server logs
- Verify token authorization

---

**Version:** 1.0.0  
**Last Updated:** December 6, 2025  
**Status:** Production Ready ✅
