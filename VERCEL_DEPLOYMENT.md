# 🚀 Vercel Deployment Guide - National Health Record System Backend

This guide will help you deploy your NestJS backend application to Vercel with Swagger API documentation enabled in production.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier available)
2. **MongoDB Database**: You'll need a production MongoDB instance:
   - **Recommended**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
   - Alternative: Any MongoDB hosting service
3. **Redis Instance** (Optional but recommended for caching and queues):
   - [Redis Cloud](https://redis.com/try-free/) (free tier available)
   - Alternative: [Upstash Redis](https://upstash.com/) (generous free tier)

## 🎯 Quick Deployment Steps

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 2: Push Code to GitHub

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

### Step 3: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Select **"Import Git Repository"**
4. Choose your **national-health-record-system** repository
5. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 4: Configure Environment Variables

In the Vercel project settings, add these environment variables:

#### Required Variables

```env
NODE_ENV=production
PORT=3000

# MongoDB (REQUIRED)
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/health-record-system?retryWrites=true&w=majority

# JWT Secrets (REQUIRED - Generate strong secrets!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-different-from-above
JWT_REFRESH_EXPIRY=7d

# Email Configuration (REQUIRED for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM=National Health System <your-email@gmail.com>

# Frontend URL (Update with your frontend URL)
FRONTEND_URL=https://your-frontend-app.vercel.app
ALLOWED_ORIGINS=https://your-frontend-app.vercel.app,http://localhost:3000

# Swagger Configuration (ENABLED by default)
# To disable: DISABLE_SWAGGER=true
# DISABLE_SWAGGER=false
```

#### Optional Variables (Recommended for production)

```env
# Redis for Caching & Queues
REDIS_URL=redis://username:password@redis-host:port
QUEUE_REDIS_URL=redis://username:password@redis-host:port/1

# AWS S3 for Document Storage (if using)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# AWS KMS for Encryption (if using)
AWS_KMS_KEY_ID=your-kms-key-id

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Request Limits
REQUEST_BODY_LIMIT=10mb
```

### Step 5: Generate Strong JWT Secrets

Run this command to generate secure secrets:

```bash
node -e "console.log('JWT_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated values and use them in your Vercel environment variables.

### Step 6: Deploy

Click **"Deploy"** button in Vercel dashboard.

## 🎉 Post-Deployment

### Access Your API

Once deployed, your API will be available at:

```
https://your-project-name.vercel.app
```

### Access Swagger Documentation

Swagger is **enabled by default** in production. Access it at:

```
https://your-project-name.vercel.app/api/docs
```

### Test Health Endpoint

```
https://your-project-name.vercel.app/health
```

## 📝 Important Notes

### ✅ Swagger is Enabled in Production

Your Swagger documentation is now **publicly accessible** by default, which is perfect for frontend developers to:

- View all API endpoints
- Test API calls directly from browser
- See request/response schemas
- Understand authentication flow

**To disable Swagger** (if needed in future):

- Add environment variable: `DISABLE_SWAGGER=true`

### 🔒 Security Recommendations

1. **Strong Secrets**: Use the generated 64-character secrets for JWT
2. **CORS Configuration**: Update `ALLOWED_ORIGINS` with your actual frontend URLs
3. **MongoDB**: Use MongoDB Atlas with network access restrictions
4. **Environment Variables**: Never commit `.env` files to Git
5. **Rate Limiting**: Configure appropriate rate limits for production traffic

### ⚡ Performance Tips

1. **Redis**: Add Redis for better performance (caching + queue management)
2. **MongoDB Atlas**: Use a cluster in the same region as Vercel deployment
3. **Connection Pooling**: MongoDB Atlas handles this automatically
4. **CDN**: Vercel provides CDN automatically for static assets

## 🔧 Troubleshooting

### Build Fails

If build fails, check:

1. All dependencies are in `dependencies` (not `devDependencies`)
2. TypeScript compiles without errors locally
3. Build command is set to `npm run vercel-build`

### API Returns 404

Check:

1. `vercel.json` routes configuration
2. Vercel logs for errors
3. Environment variables are set correctly

### MongoDB Connection Issues

Check:

1. MongoDB Atlas network access allows Vercel IPs (or set to `0.0.0.0/0` for all)
2. Database credentials are correct
3. Connection string format is correct

### Swagger Not Loading

Check:

1. `DISABLE_SWAGGER` is not set to `true`
2. Visit `/api/docs` (not `/docs`)
3. Check Vercel function logs for errors

## 🔄 Redeployment

Vercel automatically redeploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

## 📊 Monitoring

View deployment logs:

1. Go to Vercel dashboard
2. Select your project
3. Click on "Deployments"
4. Click on any deployment to see logs

## 🎓 Default Admin Credentials

After first deployment, seed the database with default admin:

**Email**: `admin@national-health-record-system.com`  
**Password**: `Admin@123456`

⚠️ **IMPORTANT**: Change the admin password immediately after first login!

## 🆘 Need Help?

- Vercel Docs: https://vercel.com/docs
- NestJS Deployment: https://docs.nestjs.com/faq/serverless
- MongoDB Atlas Setup: https://www.mongodb.com/docs/atlas/getting-started/

---

## 📱 Share with Frontend Developers

After deployment, share this information with your frontend team:

```
🎯 API Base URL: https://your-project-name.vercel.app
📚 Swagger Docs: https://your-project-name.vercel.app/api/docs
❤️ Health Check: https://your-project-name.vercel.app/health

🔐 Default Test Credentials:
Email: admin@national-health-record-system.com
Password: Admin@123456

📖 API Documentation:
All endpoints, request/response formats, and authentication flow
are available in the Swagger UI above.
```

---

**Deployment Status**: ✅ Ready for Production  
**Swagger Documentation**: ✅ Enabled & Public  
**Last Updated**: December 5, 2025
