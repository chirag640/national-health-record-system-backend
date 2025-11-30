# 🔐 Authentication API Reference

## Base URL

```
Development: http://localhost:3000
Production: https://api.yourdomain.com
```

---

## 📋 Table of Contents

1. [Patient Authentication](#patient-authentication)
2. [Doctor Authentication](#doctor-authentication)
3. [Hospital Admin Authentication](#hospital-admin-authentication)
4. [Super Admin Authentication](#super-admin-authentication)
5. [Common Endpoints](#common-endpoints)
6. [Error Codes](#error-codes)

---

## Patient Authentication

### Register Patient

**Endpoint:** `POST /auth/register/patient`

**Rate Limit:** 5 requests/minute

**Request:**

```json
{
  "email": "patient@example.com",
  "password": "SecureP@ssw0rd123",
  "fullName": "John Doe"
}
```

**Password Requirements:**

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number or special character

**Response (201):**

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Errors:**

- `400` - Validation error
- `409` - Email already exists
- `429` - Rate limit exceeded

---

### Patient Login (Password)

**Endpoint:** `POST /auth/login`

**Rate Limit:** 10 requests/minute

**Request:**

```json
{
  "email": "patient@example.com",
  "password": "SecureP@ssw0rd123",
  "role": "Patient"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000.eyJzdWI...",
  "expiresIn": 900,
  "role": "Patient",
  "email": "patient@example.com",
  "userId": "507f1f77bcf86cd799439011",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**JWT Payload:**

```json
{
  "sub": "507f1f77bcf86cd799439011",
  "email": "patient@example.com",
  "role": "Patient",
  "patientId": "patient-guid-123",
  "permissions": [
    "read:own_profile",
    "update:own_profile",
    "read:own_documents",
    "read:own_encounters",
    "manage:own_consents",
    "download:own_documents"
  ],
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Errors:**

- `401` - Invalid credentials
- `401` - Email not verified
- `401` - Account locked (5 failed attempts)
- `401` - Account inactive

---

### Patient Login (OTP - Optional)

**Step 1: Request OTP**

**Endpoint:** `POST /auth/login/request-otp`

**Rate Limit:** 3 requests/minute

**Request:**

```json
{
  "email": "patient@example.com",
  "role": "Patient"
}
```

**Response (200):**

```json
{
  "message": "OTP sent to your email"
}
```

**Step 2: Verify OTP**

**Endpoint:** `POST /auth/login/verify-otp`

**Rate Limit:** 5 requests/minute

**Request:**

```json
{
  "email": "patient@example.com",
  "otp": "849220",
  "purpose": "login"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000.eyJzdWI...",
  "expiresIn": 900,
  "role": "Patient",
  "email": "patient@example.com",
  "userId": "507f1f77bcf86cd799439011",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**OTP Details:**

- 6-digit numeric code
- Valid for 5 minutes
- Maximum 3 verification attempts
- Auto-deleted after expiry

**Errors:**

- `400` - OTP invalid or expired
- `400` - OTP incorrect (attempts remaining)
- `400` - Maximum attempts exceeded

---

## Doctor Authentication

### Register Doctor

**Endpoint:** `POST /auth/register/doctor`

**Authentication:** Required (Hospital Admin)

**Rate Limit:** Default

**Headers:**

```
Authorization: Bearer <admin-access-token>
```

**Request:**

```json
{
  "email": "doctor@hospital.com",
  "password": "VerySecureP@ssw0rd123!",
  "fullName": "Dr. Jane Smith",
  "phone": "+919876543210",
  "specialization": "Cardiology",
  "licenseNumber": "MD12345",
  "hospitalId": "507f1f77bcf86cd799439011"
}
```

**Password Requirements:**

- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Response (201):**

```json
{
  "userId": "507f1f77bcf86cd799439012",
  "doctorId": "507f1f77bcf86cd799439013",
  "message": "Doctor registered successfully. Verification email sent."
}
```

**Permissions Required:** Hospital Admin must be from the same hospital

**Errors:**

- `401` - Unauthorized (not hospital admin)
- `403` - Cannot register doctor for different hospital
- `409` - Email already exists

---

### Doctor Login

**Endpoint:** `POST /auth/login`

**Rate Limit:** 10 requests/minute

**Request:**

```json
{
  "email": "doctor@hospital.com",
  "password": "VerySecureP@ssw0rd123!",
  "role": "Doctor"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000.eyJzdWI...",
  "expiresIn": 900,
  "role": "Doctor",
  "email": "doctor@hospital.com",
  "userId": "507f1f77bcf86cd799439012",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**JWT Payload:**

```json
{
  "sub": "507f1f77bcf86cd799439012",
  "email": "doctor@hospital.com",
  "role": "Doctor",
  "hospitalId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439013",
  "permissions": [
    "read:patient_data_with_consent",
    "create:encounters",
    "create:documents_with_consent",
    "read:own_profile",
    "update:own_profile"
  ],
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Security Requirements:**

- ✅ Email verification mandatory
- ✅ Strong password required
- ✅ Account locking after 5 failed attempts

---

## Hospital Admin Authentication

### Register Hospital Admin

**Endpoint:** `POST /auth/register/hospital-admin`

**Authentication:** Required (Super Admin)

**Headers:**

```
Authorization: Bearer <super-admin-access-token>
```

**Request:**

```json
{
  "email": "admin@hospital.com",
  "password": "VerySecureP@ssw0rd123!",
  "fullName": "Admin Name",
  "hospitalId": "507f1f77bcf86cd799439011"
}
```

**Response (201):**

```json
{
  "userId": "507f1f77bcf86cd799439014",
  "message": "Hospital admin registered successfully. Verification email sent."
}
```

---

### Hospital Admin Login

**Endpoint:** `POST /auth/login`

**Request:**

```json
{
  "email": "admin@hospital.com",
  "password": "VerySecureP@ssw0rd123!",
  "role": "HospitalAdmin"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000.eyJzdWI...",
  "expiresIn": 900,
  "role": "HospitalAdmin",
  "email": "admin@hospital.com",
  "userId": "507f1f77bcf86cd799439014",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**JWT Payload:**

```json
{
  "sub": "507f1f77bcf86cd799439014",
  "email": "admin@hospital.com",
  "role": "HospitalAdmin",
  "hospitalId": "507f1f77bcf86cd799439011",
  "permissions": [
    "create:patients",
    "create:doctors",
    "read:hospital_data",
    "upload:documents",
    "read:hospital_audit_logs",
    "manage:hospital_users"
  ],
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1234567890,
  "exp": 1234568790
}
```

---

## Super Admin Authentication

### Register Super Admin

**Endpoint:** `POST /auth/register/super-admin`

**Rate Limit:** 1 request/hour

**Headers:**

```
X-Super-Admin-Secret: <super-admin-secret-key>
```

**Request:**

```json
{
  "email": "superadmin@health.gov.in",
  "password": "ExtremelySecureP@ssw0rd123!#",
  "fullName": "Super Admin"
}
```

**Password Requirements:**

- Minimum 16 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Response (201):**

```json
{
  "userId": "507f1f77bcf86cd799439015"
}
```

**Security:**

- Requires `SUPER_ADMIN_SECRET` environment variable
- Email auto-verified (no verification email)
- Recommended: Add TOTP MFA manually

---

### Super Admin Login

**Endpoint:** `POST /auth/login`

**Request:**

```json
{
  "email": "superadmin@health.gov.in",
  "password": "ExtremelySecureP@ssw0rd123!#",
  "role": "SuperAdmin"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000.eyJzdWI...",
  "expiresIn": 900,
  "role": "SuperAdmin",
  "email": "superadmin@health.gov.in",
  "userId": "507f1f77bcf86cd799439015",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**JWT Payload:**

```json
{
  "sub": "507f1f77bcf86cd799439015",
  "email": "superadmin@health.gov.in",
  "role": "SuperAdmin",
  "permissions": [
    "create:hospitals",
    "create:hospital_admins",
    "read:system_audit_logs",
    "manage:global_config",
    "read:all_hospitals"
  ],
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1234567890,
  "exp": 1234568790
}
```

---

## Common Endpoints

### Verify Email

**Endpoint:** `POST /auth/verify-email`

**Request:**

```json
{
  "token": "a1b2c3d4e5f6..."
}
```

**Response (200):**

```json
{
  "message": "Email verified successfully. You can now login."
}
```

---

### Refresh Access Token

**Endpoint:** `POST /auth/refresh`

**Rate Limit:** 20 requests/minute

**Request:**

```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000.eyJzdWI..."
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "new-session-id.new-jwt-token",
  "expiresIn": 900,
  "role": "Patient",
  "email": "patient@example.com",
  "userId": "507f1f77bcf86cd799439011",
  "sessionId": "new-session-id"
}
```

**Notes:**

- Refresh token is rotated on every request
- Old refresh token is revoked
- Token reuse detection enabled

---

### Logout

**Endpoint:** `POST /auth/logout`

**Request:**

```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000.eyJzdWI..."
}
```

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

### Forgot Password

**Endpoint:** `POST /auth/forgot-password`

**Rate Limit:** 3 requests/minute

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (200):**

```json
{
  "message": "If the email exists, a reset link has been sent."
}
```

**Notes:**

- Always returns success (prevents email enumeration)
- Reset token valid for 1 hour
- Email contains reset link

---

### Reset Password

**Endpoint:** `POST /auth/reset-password`

**Rate Limit:** 5 requests/minute

**Request:**

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecureP@ssw0rd123"
}
```

**Response (200):**

```json
{
  "message": "Password reset successfully. Please login with new password."
}
```

**Side Effects:**

- All active sessions are revoked
- Login attempts counter is reset
- Account unlock (if locked)

---

### Get Current User

**Endpoint:** `GET /auth/me`

**Authentication:** Required

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response (200):**

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "patient@example.com",
  "role": "Patient",
  "hospitalId": null,
  "patientId": "patient-guid-123",
  "doctorId": null,
  "permissions": [
    "read:own_profile",
    "update:own_profile",
    "read:own_documents",
    "read:own_encounters",
    "manage:own_consents",
    "download:own_documents"
  ]
}
```

---

## Error Codes

### Standard HTTP Status Codes

| Code | Meaning               | Description                     |
| ---- | --------------------- | ------------------------------- |
| 200  | OK                    | Request successful              |
| 201  | Created               | Resource created                |
| 400  | Bad Request           | Validation error                |
| 401  | Unauthorized          | Authentication required/invalid |
| 403  | Forbidden             | Insufficient permissions        |
| 409  | Conflict              | Resource already exists         |
| 429  | Too Many Requests     | Rate limit exceeded             |
| 500  | Internal Server Error | Server error                    |

### Custom Error Codes

| Code                        | Description                      | HTTP Status |
| --------------------------- | -------------------------------- | ----------- |
| `EMAIL_ALREADY_EXISTS`      | Email is already registered      | 409         |
| `INVALID_CREDENTIALS`       | Email or password incorrect      | 401         |
| `EMAIL_NOT_VERIFIED`        | Email verification required      | 401         |
| `ACCOUNT_LOCKED`            | Too many failed login attempts   | 401         |
| `ACCOUNT_INACTIVE`          | Account has been deactivated     | 401         |
| `OTP_INVALID_OR_EXPIRED`    | OTP is invalid or has expired    | 400         |
| `OTP_INCORRECT`             | OTP does not match               | 400         |
| `OTP_MAX_ATTEMPTS_EXCEEDED` | Maximum OTP attempts reached     | 400         |
| `TOKEN_REUSE_DETECTED`      | Refresh token reused (security)  | 401         |
| `INVALID_TOKEN`             | Verification/reset token invalid | 400         |
| `INSUFFICIENT_PERMISSIONS`  | Missing required permissions     | 403         |

### Error Response Format

```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized",
  "code": "INVALID_CREDENTIALS",
  "timestamp": "2025-11-30T10:30:00.000Z",
  "path": "/auth/login"
}
```

---

## Rate Limiting

### Limits by Endpoint

| Endpoint                     | Limit | Window   |
| ---------------------------- | ----- | -------- |
| `/auth/register/patient`     | 5     | 1 minute |
| `/auth/register/super-admin` | 1     | 1 hour   |
| `/auth/login`                | 10    | 1 minute |
| `/auth/login/request-otp`    | 3     | 1 minute |
| `/auth/login/verify-otp`     | 5     | 1 minute |
| `/auth/refresh`              | 20    | 1 minute |
| `/auth/forgot-password`      | 3     | 1 minute |
| `/auth/reset-password`       | 5     | 1 minute |

### Rate Limit Response

```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again later.",
  "error": "Too Many Requests"
}
```

**Headers:**

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1638345600
Retry-After: 60
```

---

## Testing with cURL

### Register Patient

```bash
curl -X POST http://localhost:3000/auth/register/patient \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "fullName": "Test User"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "role": "Patient"
  }'
```

### Get Current User

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <access-token>"
```

### Refresh Token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refresh-token>"
  }'
```

---

## Postman Collection

Import the provided `postman-collection.json` file for pre-configured requests.

**Variables to set:**

- `baseUrl`: http://localhost:3000
- `accessToken`: (auto-updated after login)
- `refreshToken`: (auto-updated after login)

---

## Security Recommendations

1. **Always use HTTPS in production**
2. **Store tokens securely** (httpOnly cookies recommended)
3. **Implement token rotation** (already built-in)
4. **Monitor for suspicious activity**
5. **Use strong passwords** (enforced by validation)
6. **Enable MFA for high-privilege roles** (optional TOTP)
7. **Rotate secrets regularly**
8. **Keep dependencies updated**
9. **Log all authentication events**
10. **Rate limit all endpoints** (already implemented)

---

**For complete documentation, visit:** http://localhost:3000/api (Swagger UI)
