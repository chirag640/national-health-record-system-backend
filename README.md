# 🏥 National Health Record System

**Patient-centric EHR platform with email-based authentication, consent control, secure document storage, and comprehensive audit logging.**

## ✨ Key Features

🔐 **Email-Based Authentication**

- Zero-cost Gmail SMTP integration
- Role-based access control (Patient, Doctor, Hospital Admin, Super Admin)
- JWT tokens with automatic rotation
- Email OTP verification
- Password reset via email
- Session management with token reuse detection

👥 **Multi-Role System**

- **Patient**: Manage own health records and consents
- **Doctor**: Access patient data with consent
- **Hospital Admin**: Register patients and doctors
- **Super Admin**: System-wide management

🛡️ **Enterprise Security**

- Bcrypt password hashing
- Rate limiting on all endpoints
- Account locking after failed attempts
- Email verification mandatory
- Consent-aware data access
- Comprehensive audit logging

💰 **Zero Operational Cost**

- Gmail SMTP: FREE (unlimited emails)
- Email OTP: FREE (no SMS charges)
- MongoDB: FREE (local or Atlas M0 tier)
- Redis: FREE (local or Redis Cloud free tier)

**Total Monthly Cost: ₹0**

---

## 📋 Description

Production-ready healthcare platform built with NestJS and MongoDB, featuring a complete email-based authentication system designed for zero-cost operation.

**Author:** Your Organization  
**License:** MIT

## 🚀 Tech Stack

- **Framework:** NestJS 10
- **Language:** TypeScript
- **Database:** MongoDB (with Mongoose)
- **Cache/Queue:** Redis
- **Authentication:** JWT + Email OTP
- **Email:** Gmail SMTP (FREE)
- **API Docs:** Swagger/OpenAPI

## 📦 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Gmail SMTP (FREE)

**Enable Gmail App Password:**

1. Visit: https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Visit: https://myaccount.google.com/apppasswords
4. Generate app password (16 characters)

### 3. Setup Environment

```bash
cp .env.example .env
```

**Edit .env with your values:**

```env
# Database
DATABASE_URL=mongodb://localhost:27017/health-records

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-different-secret-here

# Gmail SMTP (FREE!)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
EMAIL_FROM=Health System <your-email@gmail.com>

# Super Admin Secret
SUPER_ADMIN_SECRET=your-super-admin-secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379
```

### 4. Start Services

```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Redis (optional but recommended)
redis-server

# Terminal 3: Application
npm run start:dev
```

**Application running at:** http://localhost:3000

**API Documentation:** http://localhost:3000/api

---

## 🧪 Test the System

### Register a Patient

```bash
curl -X POST http://localhost:3000/auth/register/patient \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "Test@1234",
    "fullName": "Test Patient"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "Test@1234",
    "role": "Patient"
  }'
```

**See [QUICK_START.md](QUICK_START.md) for complete testing guide.**

---

## 🏃 Running the App

```bash
# Development mode with hot reload
npm run start:dev
# MongoDB connection string
DATABASE_URL=mongodb://localhost:27017/national-health-record-system

PORT=3000
```

## 🏃 Running the app

```bash
# Development
npm run start:dev

# Production mode
npm run start:prod
```

## 🐳 Docker Support

### Using Docker Compose (Recommended)

```bash
# Start all services (app + database)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Using Dockerfile only

```bash
# Build image
docker build -t national-health-record-system .

# Run container
docker run -p 3000:3000 --env-file .env national-health-record-system
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🎯 Features

### Basic Features

- ✅ **CORS:** Cross-Origin Resource Sharing enabled
- ✅ **Helmet:** HTTP security headers protection
- ✅ **Compression:** Gzip compression for responses
- ✅ **Validation:** Global request validation with class-validator

### Advanced Features

- ✅ **Structured Logging:** Pino logger with request tracking and performance metrics
- ✅ **Redis Caching:** Distributed caching with cache-manager
- ✅ **API Documentation:** Interactive Swagger/OpenAPI docs at `/api/docs`
- ✅ **Health Checks:** Terminus health monitoring at `/health`
- ✅ **Rate Limiting:** Throttler middleware to prevent abuse
- ✅ **API Versioning:** URI-based versioning support (e.g., `/v1/users`)

## 📝 API Endpoints

### 📚 API Documentation (Swagger)

```
GET /api/docs
```

Interactive API documentation with Swagger UI. All endpoints are documented with request/response schemas and JWT authentication.

### ❤️ Health Check

```
GET /health
```

Returns system health status including:

- Database connectivity
- Memory usage (heap & RSS)
- Disk storage
- Uptime

Response:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "disk": { "status": "up" }
  },
  "details": { ... }
}
```

### Hello World

```
GET /
```

Response:

```
Hello from national-health-record-system!
```

## 📊 Logging

This project uses **Pino** for structured JSON logging with the following features:

- Request/response logging
- Performance tracking (response time)
- Context-aware logging
- Sensitive data redaction (authorization headers, cookies)
- Pretty printing in development mode

Example log output (development):

```
[14:23:45] INFO  (HTTP): Incoming Request: GET /users
[14:23:45] INFO  (HTTP): Request Completed: GET /users (responseTime: 45ms)
```

Production logs are in JSON format for easy parsing and analysis.

## 🗄️ Caching

Redis-based distributed caching is configured with:

- **Default TTL:** 5 minutes (300 seconds)
- **Strategy:** Cache-aside pattern
- **Invalidation:** Automatic on TTL expiry

### Usage Example

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class YourService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getData(key: string) {
    // Try cache first
    const cached = await this.cacheManager.get(key);
    if (cached) return cached;

    // Cache miss - fetch and store
    const data = await this.fetchData();
    await this.cacheManager.set(key, data, 600); // 10 minutes TTL
    return data;
  }
}
```

**Configuration:**
Set `REDIS_URL` in `.env` to use Redis, otherwise falls back to in-memory cache.

```env
REDIS_URL=redis://localhost:6379
```

## 🚦 Rate Limiting

Throttler middleware is configured to prevent API abuse:

- **Default:** 10 requests per 60 seconds
- **Scope:** Per IP address
- **Response:** `429 Too Many Requests` when limit exceeded

### Configuration

Adjust rate limits in `.env`:

```env
THROTTLE_TTL=60000      # Time window (ms)
THROTTLE_LIMIT=10       # Max requests per window
```

### Custom Rate Limits

Override limits per controller/route:

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('api')
export class ApiController {
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @Get('expensive-operation')
  expensiveOperation() {
    // ...
  }
}
```

## 🔄 API Versioning

URI-based API versioning is enabled. Add versions to your controllers:

```typescript
import { Controller, Get, Version } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Version('1')
  @Get()
  findAllV1() {
    return { version: 'v1', users: [] };
  }

  @Version('2')
  @Get()
  findAllV2() {
    return { version: 'v2', users: [], meta: { total: 0 } };
  }
}
```

Access endpoints:

- `GET /v1/users` - Version 1
- `GET /v2/users` - Version 2

## 📁 Project Structure

```
national-health-record-system/
├── src/
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── test/
├── .env.example
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── nest-cli.json
├── package.json
├── README.md
└── tsconfig.json
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

Generated with ❤️ by [FoundationWizard](https://github.com/yourusername/foundation-wizard)
