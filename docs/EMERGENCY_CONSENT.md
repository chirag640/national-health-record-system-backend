# Emergency Consent Override - Testing Guide

## Overview

Emergency consent override allows hospital administrators to grant temporary access to patient records in critical situations without prior patient consent.

## Security Features

- ✅ OTP verification required
- ✅ Hospital admin approval required
- ✅ 10-minute OTP expiry
- ✅ 1-hour temporary consent
- ✅ Detailed justification mandatory
- ✅ Full audit trail logged

## API Workflow

### Step 1: Request OTP

**Endpoint:** `POST /api/v1/consents/emergency/request-otp`

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Body:**

```json
{
  "adminId": "507f1f77bcf86cd799439013"
}
```

**Response:**

```json
{
  "message": "OTP sent to admin@hospital.com. Valid for 10 minutes.",
  "expiresAt": "2025-11-30T10:10:00.000Z"
}
```

### Step 2: Verify OTP

**Endpoint:** `POST /api/v1/consents/emergency/verify-otp`

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Body:**

```json
{
  "adminId": "507f1f77bcf86cd799439013",
  "otp": "123456"
}
```

**Response:**

```json
{
  "verified": true,
  "message": "OTP verified successfully"
}
```

### Step 3: Create Emergency Override

**Endpoint:** `POST /api/v1/consents/emergency/override`

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Body:**

```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439012",
  "adminId": "507f1f77bcf86cd799439013",
  "justification": "Patient brought unconscious to ER. Requires immediate medical history for life-saving treatment. Patient has critical allergy information needed for emergency procedure.",
  "otp": "123456"
}
```

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439014",
  "patientId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439012",
  "hospitalId": "507f1f77bcf86cd799439015",
  "scope": ["full"],
  "expiresAt": "2025-11-30T11:00:00.000Z",
  "isActive": true,
  "createdAt": "2025-11-30T10:00:00.000Z",
  "updatedAt": "2025-11-30T10:00:00.000Z"
}
```

## Testing with cURL

### 1. Request OTP

```bash
curl -X POST http://localhost:3000/api/v1/consents/emergency/request-otp \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": "507f1f77bcf86cd799439013"
  }'
```

### 2. Verify OTP

```bash
curl -X POST http://localhost:3000/api/v1/consents/emergency/verify-otp \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": "507f1f77bcf86cd799439013",
    "otp": "123456"
  }'
```

### 3. Create Override

```bash
curl -X POST http://localhost:3000/api/v1/consents/emergency/override \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "507f1f77bcf86cd799439011",
    "doctorId": "507f1f77bcf86cd799439012",
    "adminId": "507f1f77bcf86cd799439013",
    "justification": "Patient brought unconscious to ER. Requires immediate medical history for life-saving treatment.",
    "otp": "123456"
  }'
```

## Error Scenarios

### Invalid OTP

**Response (400):**

```json
{
  "statusCode": 400,
  "message": "Invalid OTP",
  "error": "Bad Request"
}
```

### Expired OTP

**Response (400):**

```json
{
  "statusCode": 400,
  "message": "OTP expired. Please request a new OTP.",
  "error": "Bad Request"
}
```

### Non-Admin User

**Response (403):**

```json
{
  "statusCode": 403,
  "message": "Only hospital admins can approve emergency access",
  "error": "Forbidden"
}
```

### Insufficient Justification

**Response (400):**

```json
{
  "statusCode": 400,
  "message": ["Justification must be at least 20 characters"],
  "error": "Bad Request"
}
```

## Audit Trail

All emergency overrides are automatically logged in the audit trail with:

- **Action:** `CREATE_EMERGENCY_CONSENT`
- **Resource:** `consent`
- **ResourceId:** Generated consent ID
- **UserId:** Admin who approved
- **Details:** Patient ID, Doctor ID, Justification, Timestamp
- **IP Address:** Request IP
- **User Agent:** Client information

Query audit logs:

```bash
GET /api/v1/audit-logs?action=CREATE_EMERGENCY_CONSENT
```

## Use Cases

### 1. Unconscious Patient in ER

- Patient arrives unconscious after accident
- Doctor needs medical history immediately
- Admin requests OTP → verifies → creates override
- Doctor accesses critical allergy/medication info
- Patient life saved with informed treatment

### 2. Critical Surgery

- Patient needs emergency surgery
- Anesthesiologist needs complete medical history
- Previous surgeries, allergies, current medications critical
- Admin creates temporary 1-hour access
- Safe anesthesia administration

### 3. Mental Health Crisis

- Patient in acute mental health crisis
- Cannot provide consent coherently
- Psychiatrist needs medication history
- Admin authorizes emergency access
- Proper crisis intervention administered

## Compliance Notes

- ✅ HIPAA compliant with detailed audit trail
- ✅ Indian MCI guidelines for emergency care
- ✅ Time-limited access (auto-expires after 1 hour)
- ✅ Mandatory justification for legal documentation
- ✅ Admin approval required (not automated)
- ✅ OTP verification prevents unauthorized access
- ✅ Full audit trail for legal review

## Security Best Practices

1. **Never share OTP** - Personal to admin only
2. **Detailed justification** - Minimum 20 characters, describe medical necessity
3. **Immediate use** - Don't delay after OTP verification
4. **One-time use** - OTP invalidated after verification
5. **Monitor audit logs** - Regular review for compliance
6. **Expire check** - Consent auto-expires in 1 hour, no manual action needed

## Integration with Frontend

```typescript
// React/Vue/Angular example
async function handleEmergencyAccess(patientId, doctorId, adminId) {
  try {
    // Step 1: Request OTP
    const otpResponse = await fetch('/api/v1/consents/emergency/request-otp', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adminId }),
    });

    // Step 2: Show OTP input dialog
    const otp = await showOtpDialog();

    // Step 3: Verify OTP
    await fetch('/api/v1/consents/emergency/verify-otp', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adminId, otp }),
    });

    // Step 4: Get justification from admin
    const justification = await showJustificationDialog();

    // Step 5: Create emergency override
    const consent = await fetch('/api/v1/consents/emergency/override', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientId,
        doctorId,
        adminId,
        justification,
        otp,
      }),
    });

    showSuccess('Emergency access granted for 1 hour');
  } catch (error) {
    showError(error.message);
  }
}
```

## Monitoring

Monitor emergency overrides in production:

```bash
# Count emergency overrides today
db.consents.countDocuments({
  isEmergencyOverride: true,
  createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
})

# List all active emergency consents
db.consents.find({
  isEmergencyOverride: true,
  isActive: true,
  expiresAt: { $gt: new Date() }
})

# Emergency override frequency by hospital
db.consents.aggregate([
  { $match: { isEmergencyOverride: true } },
  { $group: { _id: "$hospitalId", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

## Troubleshooting

**Q: OTP not received**

- Check admin's email in User collection
- Verify Gmail SMTP configuration
- Check spam folder
- Verify EmailService is working

**Q: OTP verification fails**

- Ensure OTP not expired (10 min limit)
- Check for typos in OTP entry
- Verify admin ID matches request

**Q: Cannot create override**

- Verify all IDs are valid MongoDB ObjectIds
- Ensure doctor exists and has DOCTOR role
- Check justification length (min 20 chars)
- Verify OTP was verified in same session

**Q: Doctor still cannot access records**

- Check consent expiration time
- Verify ConsentGuard is properly configured
- Check doctor's hospital matches patient's hospital
- Verify consent is active (isActive: true)
