# ⚡ Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies (1 min)

```bash
npm install
```

### Step 2: Configure Gmail (2 min)

1. **Create Gmail Account** or use existing
   - Email: `your-email@gmail.com`

2. **Enable 2FA**
   - Visit: https://myaccount.google.com/security
   - Enable "2-Step Verification"

3. **Generate App Password**
   - Visit: https://myaccount.google.com/apppasswords
   - Select: Mail → Other (Custom name)
   - Copy the 16-character password

### Step 3: Setup Environment (1 min)

```bash
# Copy example file
cp .env.example .env

# Edit .env and set these values:
```

**Minimal .env configuration:**

```env
# Database (use local MongoDB)
DATABASE_URL=mongodb://localhost:27017/health-records

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=paste-generated-secret-here
JWT_REFRESH_SECRET=paste-different-generated-secret-here

# Gmail SMTP
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
EMAIL_FROM=Health System <your-email@gmail.com>

# Super Admin Secret
SUPER_ADMIN_SECRET=create-a-strong-secret-here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Redis (optional, but recommended)
REDIS_URL=redis://localhost:6379
```

### Step 4: Start Services (1 min)

**Option A: All services locally**

```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Redis (optional)
redis-server

# Terminal 3: Application
npm run start:dev
```

**Option B: Use cloud services (free tier)**

- MongoDB: Use Atlas (https://www.mongodb.com/cloud/atlas/register)
- Redis: Use Redis Cloud (https://redis.com/try-free/)
- Just update `DATABASE_URL` and `REDIS_URL` in .env

```bash
# Terminal: Application only
npm run start:dev
```

### Step 5: Verify Setup (30 seconds)

```bash
# Test health check
curl http://localhost:3000/health

# Expected: {"status":"ok",...}
```

**Success! 🎉** Application is running at: **http://localhost:3000**

---

## 🧪 Test the System

### 1. Register a Patient

```bash
curl -X POST http://localhost:3000/auth/register/patient \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "Test@1234",
    "fullName": "Test Patient"
  }'
```

**Expected:**

```json
{
  "userId": "...",
  "message": "Registration successful. Please check your email to verify your account."
}
```

**✅ Check your email inbox** for verification email!

---

### 2. Verify Email

**Check your email** and click the verification link, or:

```bash
# Copy token from email and run:
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"token-from-email"}'
```

**Expected:**

```json
{
  "message": "Email verified successfully. You can now login."
}
```

---

### 3. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "Test@1234",
    "role": "Patient"
  }'
```

**Expected:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "550e8400-e29b-41d4...",
  "expiresIn": 900,
  "role": "Patient",
  "email": "patient@example.com",
  "userId": "..."
}
```

**✅ Copy the `accessToken`** for next request!

---

### 4. Get Your Profile

```bash
# Replace <access-token> with token from previous step
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <access-token>"
```

**Expected:**

```json
{
  "userId": "...",
  "email": "patient@example.com",
  "role": "Patient",
  "permissions": [
    "read:own_profile",
    "update:own_profile",
    "read:own_documents",
    ...
  ]
}
```

**🎉 Authentication working perfectly!**

---

## 📖 Explore More

### View API Documentation

**Swagger UI:** http://localhost:3000/api

- Interactive API documentation
- Try all endpoints
- View schemas and examples

---

## 🔐 Create Super Admin (First Time)

```bash
curl -X POST http://localhost:3000/auth/register/super-admin \
  -H "Content-Type: application/json" \
  -H "X-Super-Admin-Secret: your-secret-from-env" \
  -d '{
    "email": "admin@health.gov",
    "password": "SuperSecure@Pass123!#",
    "fullName": "System Administrator"
  }'
```

**Super admin is auto-verified** (no email verification needed).

---

## 🔄 Test OTP Login (Optional)

### Request OTP

```bash
curl -X POST http://localhost:3000/auth/login/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "role": "Patient"
  }'
```

**Check email** for 6-digit OTP.

### Login with OTP

```bash
curl -X POST http://localhost:3000/auth/login/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "otp": "123456",
    "purpose": "login"
  }'
```

---

## 🛠️ Common Issues & Fixes

### Issue: "Email sending failed"

**Solution:**

1. Check Gmail App Password is correct (16 chars, no spaces)
2. Verify 2FA is enabled
3. Try generating a new app password
4. Check spam folder

### Issue: "Database connection failed"

**Solution:**

```bash
# Make sure MongoDB is running
mongod

# Or check if it's running
ps aux | grep mongod
```

### Issue: "Redis connection failed"

**Solution:**

```bash
# Start Redis
redis-server

# Or check if running
redis-cli ping
# Should return: PONG
```

### Issue: "JWT verification failed"

**Solution:**

1. Check JWT_SECRET is set in .env
2. Restart application after .env changes
3. Clear old tokens and login again

---

## 📚 Next Steps

1. **Read Documentation**
   - [AUTH_README.md](AUTH_README.md) - Complete guide
   - [API_REFERENCE.md](API_REFERENCE.md) - All endpoints
   - [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Advanced setup

2. **Frontend Integration**
   - Use provided API examples
   - Implement token storage
   - Add auto-refresh logic

3. **Production Deployment**
   - Follow MIGRATION_GUIDE.md
   - Setup SSL/HTTPS
   - Configure production secrets
   - Enable monitoring

---

## 💡 Pro Tips

### Generate Secrets Easily

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test with Postman

Import `postman-collection.json` (if available) for pre-configured requests.

### Monitor Logs

```bash
# Watch application logs
npm run start:dev

# Logs show:
# - Authentication events
# - Email sending status
# - Errors and warnings
```

### Use Environment Files

```bash
# Development
cp .env.example .env

# Production
cp .env.example .env.production
# Edit with production values
```

---

## ✅ Checklist

Before considering setup complete:

- [ ] MongoDB running
- [ ] Redis running (optional but recommended)
- [ ] .env file configured
- [ ] Application starts without errors
- [ ] Patient registration works
- [ ] Email received (check spam)
- [ ] Email verification works
- [ ] Login successful
- [ ] JWT token received
- [ ] Protected endpoint accessible with token
- [ ] Swagger docs accessible: http://localhost:3000/api

---

## 🎯 What You Have Now

✅ **Production-ready authentication**
✅ **4 user roles** (Patient, Doctor, Admin, Super Admin)
✅ **Email + password** authentication
✅ **Email OTP** (optional for patients)
✅ **Email verification**
✅ **Password reset**
✅ **JWT tokens** with auto-refresh
✅ **Session management**
✅ **Rate limiting**
✅ **Account locking**
✅ **Role-based access control**
✅ **Permission system**
✅ **Consent-aware access**
✅ **Zero-cost operation** (Gmail SMTP is FREE!)

---

## 🚀 Start Building!

Your authentication system is ready. Start building your healthcare application features!

**Need help?** Check the comprehensive documentation:

- AUTH_README.md
- MIGRATION_GUIDE.md
- API_REFERENCE.md

**Happy coding! 💻**
