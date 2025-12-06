# 🚀 Quick Start Guide

## Step 1: Setup (First Time Only)

```bash
# Install dependencies
npm install

# Seed database with default admin (use --force to recreate)
npm run seed

# If you get login errors, re-seed the database:
npm run seed:force
```

> **Note:** If you previously seeded the database and get "Illegal arguments" error when logging in, run `npm run seed:force` to recreate the admin user with the correct schema.

## Step 2: Start Application

```bash
# Start in development mode
npm run start:dev
```

Server runs at: **http://localhost:3000**  
Swagger API Docs: **http://localhost:3000/api**

---

## 🔐 Get Authorization Token

### Using cURL:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@national-health-record-system.com",
    "password": "Admin@123456",
    "role": "Patient"
  }'
```

### Using Postman:

1. Import `postman-collection.json`
2. Use **"Login (Default Admin) ⭐"** request
3. Token is auto-saved to `{{accessToken}}` variable
4. All authenticated requests will work automatically!

---

## 📋 Default Admin Credentials

| Field    | Value                                     |
| -------- | ----------------------------------------- |
| Email    | `admin@national-health-record-system.com` |
| Password | `Admin@123456`                            |
| Role     | `Patient`                                 |

⚠️ **Note:** The seeded admin user has `Patient` role. To use other roles, register users through the appropriate endpoints.

---

## 🔑 Valid Role Values

When logging in, the `role` field must be one of:

- `Patient` ✅
- `Doctor` ✅
- `HospitalAdmin` ✅
- `SuperAdmin` ✅

❌ **WRONG:** `"role": "patient"` (lowercase will fail)  
✅ **CORRECT:** `"role": "Patient"` (PascalCase)

---

## 📡 API Endpoint Structure

### Authentication (No Version)

- `POST /api/auth/register/patient`
- `POST /api/auth/register/doctor`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET  /api/auth/me`

### All Other Endpoints (Versioned - v1)

- `GET  /api/v1/patients`
- `POST /api/v1/patients`
- `GET  /api/v1/hospitals`
- `GET  /api/v1/doctors`
- `GET  /api/v1/encounters`
- `GET  /api/v1/consents`

---

## 🧪 Test API Call

```bash
# 1. Login and save token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@national-health-record-system.com",
    "password": "Admin@123456",
    "role": "Patient"
  }' | jq -r '.accessToken')

# 2. Make authenticated request
curl -X GET http://localhost:3000/api/v1/patients \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Common Issues

### Issue: "Illegal arguments: string, undefined" (500 error on login)

**Cause:** Database was seeded with old schema (before the fix)  
**Fix:** Re-seed the database with the correct schema:

```bash
npm run seed:force
```

### Issue: "Cannot POST /api/v1/auth/login"

**Fix:** Auth endpoints don't have version. Use `/api/auth/login`

### Issue: "role must be one of the following values"

**Fix:** Use PascalCase: `Patient`, `Doctor`, `HospitalAdmin`, `SuperAdmin`

### Issue: "E11000 duplicate key error" when seeding

**Fix:** The seed script should auto-clear with `--force`, but if it fails:

```bash
# Connect to MongoDB and drop the users collection
mongosh national-health-record-system --eval "db.users.drop()"
# Then re-seed
npm run seed
```

### Issue: "Cannot find module '@nestjs/core'"

**Fix:** Run `npm install`

### Issue: "Database connection failed"

**Fix:** Make sure MongoDB is running: `mongod`

---

## 📚 Additional Resources

- **Full README:** [README.md](./README.md)
- **API Documentation:** http://localhost:3000/api (when server is running)
- **Postman Collection:** [postman-collection.json](./postman-collection.json)
- **Environment Setup:** [.env.example](./.env.example)

---

**Need Help?** Check the Swagger docs at http://localhost:3000/api for interactive API testing!
