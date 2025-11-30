# 🏥 National Health Record System - Email-Based Authentication

## ✨ Overview

Production-ready **email-based authentication system** for a national healthcare platform. This implementation is designed for **zero-cost operation** using Gmail SMTP and provides enterprise-grade security features.

### Key Features

- ✅ **Email + Password Authentication** (all roles)
- ✅ **Email OTP Verification** (optional for patients)
- ✅ **Role-Based Access Control** (Patient, Doctor, HospitalAdmin, SuperAdmin)
- ✅ **JWT Access + Refresh Tokens** with rotation
- ✅ **Session Management** with reuse detection
- ✅ **Email Verification** (mandatory for doctors/admins)
- ✅ **Password Reset** via email
- ✅ **Rate Limiting** on all auth endpoints
- ✅ **Account Locking** after failed attempts
- ✅ **Consent-Aware Permissions**
- ✅ **Gmail SMTP** (FREE, unlimited emails)

### Cost: ₹0/month 💰

- Gmail SMTP: FREE
- Email OTP: FREE (no SMS cost)
- MongoDB: FREE (local or Atlas free tier)
- Redis: FREE (local or Redis Cloud free tier)

---

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install Node.js 18+
node --version

# Install MongoDB locally
# Windows: Download from https://www.mongodb.com/try/download/community
# macOS: brew install mongodb-community
# Linux: sudo apt install mongodb

# Install Redis locally
# Windows: Download from https://github.com/microsoftarchive/redis/releases
# macOS: brew install redis
# Linux: sudo apt install redis-server
```

### 2. Clone & Install

```bash
git clone <repository-url>
cd national-health-record-system
npm install
```

### 3. Configure Gmail SMTP (FREE)

**Step 1:** Create a Gmail account (e.g., `healthsystem.noreply@gmail.com`)

**Step 2:** Enable 2-Factor Authentication

- Go to: https://myaccount.google.com/security
- Click "2-Step Verification" → Enable

**Step 3:** Generate App Password

- Go to: https://myaccount.google.com/apppasswords
- Select "Mail" and "Other (Custom name)"
- Copy the 16-character password

**Step 4:** Update `.env` file

```bash
# Copy example file
cp .env.example .env

# Edit .env and set:
SMTP_USER=healthsystem.noreply@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop  # Your 16-char app password
EMAIL_FROM=National Health System <healthsystem.noreply@gmail.com>
```

### 4. Generate Secrets

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to JWT_SECRET

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to JWT_REFRESH_SECRET

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to SUPER_ADMIN_SECRET
```

### 5. Start Services

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Redis
redis-server

# Terminal 3: Start Application
npm run start:dev
```

Application will be running at: **http://localhost:3000**

API Documentation (Swagger): **http://localhost:3000/api**

---

## 👥 User Roles & Authentication

### 1. Patient (Low-Privilege)

**Registration:**

```http
POST /auth/register/patient
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "SecureP@ssw0rd123",
  "fullName": "John Doe"
}
```

**Login Option 1: Email + Password**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "SecureP@ssw0rd123",
  "role": "Patient"
}
```

**Login Option 2: Email OTP (optional)**

```http
POST /auth/login/request-otp
{
  "email": "patient@example.com",
  "role": "Patient"
}

POST /auth/login/verify-otp
{
  "email": "patient@example.com",
  "otp": "849220",
  "purpose": "login"
}
```

**Permissions:**

- ✅ Read own profile
- ✅ Update own profile
- ✅ Read own documents
- ✅ Manage own consents
- ❌ Access other patients
- ❌ Create documents

---

### 2. Doctor (Medium-Privilege)

**Registration:** (by Hospital Admin only)

```http
POST /auth/register/doctor
Authorization: Bearer <admin-token>
Content-Type: application/json

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

**Login:**

```http
POST /auth/login
{
  "email": "doctor@hospital.com",
  "password": "VerySecureP@ssw0rd123!",
  "role": "Doctor"
}
```

**Permissions:**

- ✅ Read patient data (with consent)
- ✅ Create encounters
- ✅ Create documents (with consent)
- ❌ Create patients
- ❌ Access without consent

**Security Requirements:**

- ✅ Email verification mandatory
- ✅ Strong password (12+ chars)
- ✅ Optional: Email OTP for MFA

---

### 3. Hospital Admin (High-Privilege)

**Registration:** (by Super Admin only)

```http
POST /auth/register/hospital-admin
Authorization: Bearer <super-admin-token>

{
  "email": "admin@hospital.com",
  "password": "VerySecureP@ssw0rd123!",
  "fullName": "Admin Name",
  "hospitalId": "507f1f77bcf86cd799439011"
}
```

**Permissions:**

- ✅ Register patients
- ✅ Approve doctors
- ✅ Upload documents
- ✅ View hospital audit logs
- ❌ Access patient data without consent
- ❌ Create hospitals

---

### 4. Super Admin (Gov-Level)

**Registration:** (First-time setup only)

```http
POST /auth/register/super-admin
X-Super-Admin-Secret: <your-secret-key>

{
  "email": "superadmin@health.gov.in",
  "password": "ExtremelySecureP@ssw0rd123!#",
  "fullName": "Super Admin"
}
```

**Permissions:**

- ✅ Create hospitals
- ✅ Approve hospital admins
- ✅ View system-wide audit logs
- ✅ Manage global configuration
- ❌ Read patient data directly (consent required)

**Security Requirements:**

- ✅ 16+ character password
- ✅ Secret key required
- ✅ Recommended: Add TOTP MFA (Google Authenticator)

---

## 🔐 Security Features

### 1. Password Requirements

| Role           | Min Length | Requirements                  |
| -------------- | ---------- | ----------------------------- |
| Patient        | 8 chars    | Upper, lower, number/special  |
| Doctor         | 12 chars   | Upper, lower, number, special |
| Hospital Admin | 12 chars   | Upper, lower, number, special |
| Super Admin    | 16 chars   | Upper, lower, number, special |

### 2. Email Verification

- **Mandatory** for all roles
- Token valid for 24 hours
- Auto-sent on registration
- Blocks login until verified

### 3. OTP System

- **6-digit numeric code**
- Valid for 5 minutes
- Max 3 verification attempts
- Stored as bcrypt hash
- Auto-deleted after expiry (TTL index)

### 4. Account Locking

- **5 failed login attempts** → 30-minute lock
- Auto-unlocks after timeout
- Reset on successful login

### 5. Session Management

- **Session ID** in JWT payload
- **Refresh token rotation** on every refresh
- **Token reuse detection** → Revoke all sessions
- **Session families** for rotation tracking

### 6. Rate Limiting

| Endpoint       | Limit      |
| -------------- | ---------- |
| Register       | 5 req/min  |
| Login          | 10 req/min |
| OTP Request    | 3 req/min  |
| Password Reset | 3 req/min  |
| Super Admin    | 1 req/hour |

---

## 📧 Email Templates

Located in: `src/email/templates/`

1. **otp-verification.hbs** - OTP codes
2. **email-verification.hbs** - Email verification
3. **password-reset.hbs** - Password reset
4. **welcome.hbs** - Welcome email
5. **notification.hbs** - General notifications

---

## 🔑 JWT Token Structure

### Access Token (15 min expiry)

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "Doctor",
  "hospitalId": "hospital-id",
  "doctorId": "doctor-id",
  "permissions": ["read:patient_data_with_consent", "create:encounters"],
  "sessionId": "uuid-v4",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Refresh Token (7 days expiry)

```
format: <sessionId>.<jwtToken>
example: 550e8400-e29b-41d4-a716-446655440000.eyJhbG...
```

---

## 🛡️ API Security Best Practices

### 1. Always Use HTTPS in Production

```typescript
// In production, enforce HTTPS
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}
```

### 2. Use httpOnly Cookies for Tokens (Optional)

```typescript
// Instead of sending tokens in response body
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 900000,
});
```

### 3. Implement CORS Properly

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## 📊 Database Schemas

### User Schema

```typescript
{
  email: string (unique, indexed),
  passwordHash: string,
  role: "Patient" | "Doctor" | "HospitalAdmin" | "SuperAdmin",
  emailVerified: boolean,
  hospitalId?: ObjectId,
  patientId?: string,
  doctorId?: ObjectId,
  fullName: string,
  isActive: boolean,
  lastLoginAt: Date,
  loginAttempts: number,
  lockUntil?: Date
}
```

### Session Schema

```typescript
{
  sessionId: string (unique),
  userId: ObjectId,
  refreshTokenHash: string,
  family: string,
  expiresAt: Date (TTL index),
  isRevoked: boolean,
  ipAddress: string,
  userAgent: string
}
```

### OTP Schema

```typescript
{
  email: string,
  otpHash: string,
  purpose: "login" | "email_verification" | "mfa",
  expiresAt: Date (TTL index),
  isUsed: boolean,
  attempts: number
}
```

---

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Test Endpoints with cURL

```bash
# Register patient
curl -X POST http://localhost:3000/auth/register/patient \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234","fullName":"Test User"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234","role":"Patient"}'
```

---

## 📝 Environment Variables Reference

| Variable             | Required | Default                | Description                      |
| -------------------- | -------- | ---------------------- | -------------------------------- |
| `NODE_ENV`           | No       | development            | Application environment          |
| `PORT`               | No       | 3000                   | Server port                      |
| `DATABASE_URL`       | Yes      | -                      | MongoDB connection string        |
| `JWT_SECRET`         | Yes      | -                      | Access token secret (32+ chars)  |
| `JWT_REFRESH_SECRET` | Yes      | -                      | Refresh token secret (32+ chars) |
| `SMTP_USER`          | Yes      | -                      | Gmail email address              |
| `SMTP_PASSWORD`      | Yes      | -                      | Gmail app password               |
| `SUPER_ADMIN_SECRET` | Yes      | -                      | Super admin registration key     |
| `REDIS_URL`          | No       | redis://localhost:6379 | Redis connection                 |
| `FRONTEND_URL`       | Yes      | http://localhost:3000  | Frontend URL for emails          |

---

## 🚨 Troubleshooting

### Issue: Emails not sending

**Solution:**

1. Verify Gmail 2FA is enabled
2. Check app password is correct (16 chars, no spaces)
3. Check SMTP_USER matches the Gmail account
4. Try logging into Gmail manually to verify account

### Issue: JWT verification failed

**Solution:**

1. Check JWT_SECRET is set correctly
2. Verify token hasn't expired
3. Check Bearer token format: `Authorization: Bearer <token>`

### Issue: Account locked

**Solution:**

- Wait 30 minutes for auto-unlock
- Or manually reset in database:

```javascript
db.users.updateOne({ email: 'user@example.com' }, { $set: { loginAttempts: 0, lockUntil: null } });
```

---

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [JWT Best Practices](https://jwt.io/introduction)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [OWASP Auth Guide](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 📄 License

MIT

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

---

## ⚖️ Compliance

This implementation follows:

- ✅ HIPAA guidelines (with proper deployment)
- ✅ GDPR principles
- ✅ OWASP Top 10 security standards
- ✅ JWT RFC 7519
- ✅ OAuth 2.0 best practices

---

**Built with ❤️ for secure, zero-cost healthcare authentication**
