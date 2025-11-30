# 🔄 Migration & Setup Guide

## Complete Setup Checklist

### Phase 1: Environment Setup ✅

#### 1.1 Install Dependencies

```bash
npm install
```

**New dependencies added:**

- ✅ `@nestjs/jwt` - JWT token generation
- ✅ `@nestjs/passport` - Authentication framework
- ✅ `passport-jwt` - JWT strategy
- ✅ `bcryptjs` - Password hashing
- ✅ `otplib` - OTP generation
- ✅ `@nestjs-modules/mailer` - Email service
- ✅ `nodemailer` - SMTP client

#### 1.2 Gmail SMTP Setup (FREE)

**Step-by-Step:**

1. **Create Gmail Account**
   - Visit: https://accounts.google.com/signup
   - Create account: `healthsystem.noreply@gmail.com`

2. **Enable 2-Factor Authentication**
   - Visit: https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow setup wizard

3. **Generate App Password**
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" dropdown
   - Select "Other (Custom name)"
   - Name it: "National Health System"
   - Copy 16-character password

4. **Update .env**
   ```env
   SMTP_USER=healthsystem.noreply@gmail.com
   SMTP_PASSWORD=abcd efgh ijkl mnop
   ```

#### 1.3 Generate Security Keys

```bash
# JWT Access Token Secret (32+ chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: 8f7d9a2c4e1b6f3a8d5c9e7b2f4a6c8e1d3b5a7c9e2f4b6d8a1c3e5b7d9f2a4c

# JWT Refresh Token Secret (32+ chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: 3b8d1f6a9c2e5b7d4a8f1c3e6b9d2a5c7e4f8b1d6a3c9e2f5b8d7a4c1e6b3d9

# Super Admin Secret (32+ chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: 7e2b9a4d6f1c8e3b5a7d9f2c4e6b8a1d3f5c7e9b2a4d6f8c1e3b5d7a9f2e4b

# CSRF Secret (optional)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Update .env:**

```env
JWT_SECRET=8f7d9a2c4e1b6f3a8d5c9e7b2f4a6c8e1d3b5a7c9e2f4b6d8a1c3e5b7d9f2a4c
JWT_REFRESH_SECRET=3b8d1f6a9c2e5b7d4a8f1c3e6b9d2a5c7e4f8b1d6a3c9e2f5b8d7a4c1e6b3d9
SUPER_ADMIN_SECRET=7e2b9a4d6f1c8e3b5a7d9f2c4e6b8a1d3f5c7e9b2a4d6f8c1e3b5d7a9f2e4b
CSRF_SECRET=5a9d2f6b8c1e4a7d3b9f2e5c8a4d7b1f6e3c9a2d5b8f1e4c7a3d6b9e2f5a8d
```

#### 1.4 Database Setup

**MongoDB (Local):**

```bash
# Install MongoDB
# Windows: Download from https://www.mongodb.com/try/download/community
# macOS: brew install mongodb-community
# Linux: sudo apt install mongodb

# Start MongoDB
mongod --dbpath=/data/db
```

**MongoDB Atlas (FREE Cloud):**

1. Visit: https://www.mongodb.com/cloud/atlas/register
2. Create free cluster (M0 Sandbox)
3. Create database user
4. Whitelist IP: 0.0.0.0/0 (allow from anywhere)
5. Get connection string
6. Update .env:
   ```env
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/health-records?retryWrites=true&w=majority
   ```

**Redis (Local):**

```bash
# Install Redis
# Windows: https://github.com/microsoftarchive/redis/releases
# macOS: brew install redis
# Linux: sudo apt install redis-server

# Start Redis
redis-server
```

**Redis Cloud (FREE):**

1. Visit: https://redis.com/try-free/
2. Create free database (30MB)
3. Get connection string
4. Update .env:
   ```env
   REDIS_URL=redis://username:password@redis-host:port
   ```

---

### Phase 2: Database Migration 🗄️

#### 2.1 Current State Analysis

**Existing Collections:**

- `patients` - Has phone auth
- `doctors` - Has phone auth
- `hospitals` - No auth
- `consents` - Permission system
- `encounters` - Medical records
- `healthdocuments` - Document storage
- `auditlogs` - Audit trail

#### 2.2 Migration Strategy

**Option A: Clean Install (Recommended for New Projects)**

1. Drop existing auth-related data:

```javascript
// Run in MongoDB shell
db.patients.updateMany({}, { $unset: { phone: '', otpHash: '', otpExpiry: '' } });
db.doctors.updateMany({}, { $unset: { phone: '', otpHash: '', otpExpiry: '' } });
```

2. Start fresh with new User collection

**Option B: Migrate Existing Data**

1. Create migration script:

```typescript
// src/scripts/migrate-to-email-auth.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthMigrationService {
  async migratePatients() {
    const patients = await this.patientModel.find();

    for (const patient of patients) {
      // Create User account for each patient
      const defaultPassword = await bcrypt.hash('TempPassword123!', 12);

      await this.userModel.create({
        email: `patient${patient._id}@temp.com`, // Temporary email
        passwordHash: defaultPassword,
        role: 'Patient',
        patientId: patient._id,
        fullName: patient.fullName,
        emailVerified: false,
      });
    }
  }
}
```

2. Run migration:

```bash
npm run seed:migrate
```

#### 2.3 Create Initial Super Admin

```bash
# Method 1: Via API (with secret key)
curl -X POST http://localhost:3000/auth/register/super-admin \
  -H "Content-Type: application/json" \
  -H "X-Super-Admin-Secret: 7e2b9a4d6f1c8e3b5a7d9f2c4e6b8a1d3f5c7e9b2a4d6f8c1e3b5d7a9f2e4b" \
  -d '{
    "email": "admin@health.gov.in",
    "password": "SuperSecureP@ssw0rd123!#",
    "fullName": "System Administrator"
  }'

# Method 2: Direct database insert
db.users.insertOne({
  email: "admin@health.gov.in",
  passwordHash: "$2a$12$...", // Generate with: bcrypt.hash("password", 12)
  role: "SuperAdmin",
  fullName: "System Administrator",
  emailVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

### Phase 3: Frontend Integration 🖥️

#### 3.1 Update API Calls

**Old (Phone-based):**

```typescript
// ❌ Remove this
const response = await fetch('/auth/send-otp', {
  method: 'POST',
  body: JSON.stringify({ phone: '+919876543210' }),
});
```

**New (Email-based):**

```typescript
// ✅ Use this
const response = await fetch('/auth/register/patient', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'patient@example.com',
    password: 'SecureP@ss123',
    fullName: 'John Doe',
  }),
});
```

#### 3.2 Login Flow

```typescript
// Patient Login
async function loginPatient(email: string, password: string) {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      role: 'Patient',
    }),
  });

  const data = await response.json();

  // Store tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);

  return data;
}

// Doctor Login
async function loginDoctor(email: string, password: string) {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      role: 'Doctor',
    }),
  });

  const data = await response.json();
  return data;
}
```

#### 3.3 Token Refresh

```typescript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');

  const response = await fetch('http://localhost:3000/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);

  return data.accessToken;
}

// Automatic refresh
setInterval(
  async () => {
    await refreshAccessToken();
  },
  14 * 60 * 1000,
); // Refresh every 14 minutes
```

#### 3.4 Authenticated Requests

```typescript
async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  // Handle token expiry
  if (response.status === 401) {
    await refreshAccessToken();
    return makeAuthenticatedRequest(url, options); // Retry
  }

  return response;
}
```

---

### Phase 4: Testing 🧪

#### 4.1 Health Check

```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","info":{"database":{"status":"up"},...}}
```

#### 4.2 Test Registration

```bash
# Register Patient
curl -X POST http://localhost:3000/auth/register/patient \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "fullName": "Test User"
  }'

# Expected: {"userId":"...","message":"Registration successful. Please check your email..."}
```

#### 4.3 Test Email Verification

```bash
# Check email inbox for verification link
# Click link or copy token

curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"<token-from-email>"}'
```

#### 4.4 Test Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "role": "Patient"
  }'

# Expected: {"accessToken":"...","refreshToken":"...","expiresIn":900,...}
```

#### 4.5 Test Protected Endpoint

```bash
# Get current user
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <access-token>"

# Expected: {"userId":"...","email":"...","role":"Patient",...}
```

---

### Phase 5: Deployment 🚀

#### 5.1 Production Environment Variables

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<production-mongodb-url>
REDIS_URL=<production-redis-url>

# Strong secrets (regenerate for production)
JWT_SECRET=<64-char-production-secret>
JWT_REFRESH_SECRET=<64-char-production-secret>
SUPER_ADMIN_SECRET=<64-char-production-secret>

# Gmail SMTP (use dedicated account)
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=<app-password>
EMAIL_FROM=National Health System <noreply@yourdomain.com>

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# CORS
ALLOWED_ORIGINS=https://yourdomain.com

# Security
CSRF_SECRET=<production-csrf-secret>

# Enable Swagger only in dev
ENABLE_SWAGGER=false
```

#### 5.2 SSL/TLS Setup

```bash
# Using Let's Encrypt (FREE)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 5.3 Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 5.4 PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/main.js --name health-system

# Auto-restart on reboot
pm2 startup
pm2 save

# Monitor
pm2 monit
```

---

### Phase 6: Monitoring & Maintenance 📊

#### 6.1 Health Checks

```bash
# Application health
curl https://yourdomain.com/api/health

# Database connection
curl https://yourdomain.com/api/health/db

# Redis connection
curl https://yourdomain.com/api/health/redis
```

#### 6.2 Log Monitoring

```bash
# Application logs
pm2 logs health-system

# Error logs only
pm2 logs health-system --err

# Access logs
tail -f /var/log/nginx/access.log
```

#### 6.3 Database Backups

```bash
# MongoDB backup
mongodump --uri="mongodb+srv://..." --out=/backup/$(date +%Y%m%d)

# Automated daily backups
crontab -e
# Add: 0 2 * * * /usr/bin/mongodump --uri="..." --out=/backup/$(date +\%Y\%m\%d)
```

---

### Troubleshooting Common Issues 🔧

#### Issue 1: "Email sending failed"

**Symptoms:** Registration succeeds but no email received

**Solutions:**

1. Check Gmail App Password is correct
2. Verify 2FA is enabled on Gmail
3. Check spam folder
4. Test SMTP connection:
   ```bash
   npm install -g nodemailer
   node -e "
   const nodemailer = require('nodemailer');
   const transport = nodemailer.createTransport({
     host: 'smtp.gmail.com',
     port: 587,
     auth: {
       user: 'your-email@gmail.com',
       pass: 'your-app-password'
     }
   });
   transport.verify().then(console.log).catch(console.error);
   "
   ```

#### Issue 2: "JWT malformed"

**Symptoms:** 401 Unauthorized on protected routes

**Solutions:**

1. Check Bearer token format: `Authorization: Bearer <token>`
2. Verify JWT_SECRET matches between .env and code
3. Check token hasn't expired
4. Clear localStorage and re-login

#### Issue 3: "Database connection failed"

**Symptoms:** Application won't start

**Solutions:**

1. Verify MongoDB is running: `mongosh`
2. Check DATABASE_URL format
3. Verify credentials
4. Check network connectivity

---

## Success Checklist ✅

- [ ] MongoDB running and accessible
- [ ] Redis running and accessible
- [ ] Gmail SMTP configured with App Password
- [ ] All environment variables set in .env
- [ ] Dependencies installed (`npm install`)
- [ ] Application starts without errors
- [ ] Super Admin account created
- [ ] Patient registration works
- [ ] Email verification received
- [ ] Login works for all roles
- [ ] Protected routes require authentication
- [ ] Token refresh works
- [ ] OTP emails received
- [ ] Password reset works
- [ ] Rate limiting active
- [ ] Swagger docs accessible (dev only)

---

## Next Steps 🎯

1. **Security Audit**
   - Review all authentication flows
   - Test rate limiting
   - Check CORS configuration
   - Verify JWT expiry times

2. **Performance Testing**
   - Load test auth endpoints
   - Monitor database queries
   - Check Redis caching

3. **User Documentation**
   - Create user guides for each role
   - Document API endpoints
   - Provide integration examples

4. **Monitoring Setup**
   - Set up error tracking (Sentry)
   - Configure uptime monitoring
   - Set up email alerts

---

**Migration Complete! 🎉**

You now have a fully functional, production-ready, email-based authentication system with zero operational cost.
