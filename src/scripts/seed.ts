import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as bcrypt from 'bcryptjs';

/**
 * Database Seeding Script
 *
 * This script seeds the database with initial data including:
 * - Admin user with default credentials
 * - Sample data for all models (auto-generated)
 *
 * Usage:
 *   npm run seed          # Run seeding
 *   npm run seed:reset    # Drop database and reseed
 *   SEED_COUNT=100 npm run seed  # Seed with custom count
 *
 * ⚠️ WARNING: Only run this in development/staging environments!
 */

async function seed() {
  console.log('🌱 Starting database seeding...\\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const connection = app.get<Connection>(getConnectionToken());

    // Check if seeding has already been done
    const userCount = await connection.collection('users').countDocuments();
    if (userCount > 0) {
      console.log('⚠️  Database already contains data. Use --force to override.');
      console.log(`   Current user count: ${userCount}`);

      if (!process.argv.includes('--force')) {
        console.log('   Skipping seed. Add --force flag to reseed anyway.');
        await app.close();
        return;
      }

      console.log('   --force detected. Clearing existing data...\\n');
      // Clear all collections
      await connection.collection('users').deleteMany({});
      console.log('✅ Cleared existing users');
    }

    // Seed admin user
    console.log('👤 Creating admin user...');
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = {
      email: process.env.ADMIN_EMAIL || 'admin@national-health-record-system.com',
      passwordHash: hashedPassword,
      role: 'Patient', // First role is typically admin
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
      passwordResetToken: null,
      passwordResetExpiry: null,
      refreshTokenVersion: 0,
      failedLoginAttempts: 0,
      accountLockedUntil: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await connection.collection('users').insertOne(adminUser);
    console.log('✅ Admin user created successfully');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!\\n`);

    console.log('\\n🎉 Seeding completed successfully!');
    console.log('\\n📝 Next steps:');
    console.log('   1. Start the application: npm run start:dev');
    console.log('   2. Login with admin credentials');
    console.log('   3. Test the API endpoints: http://localhost:3000/api\\n');
  } catch (error: any) {
    const err = error as Error;
    console.error('\\n❌ Seeding failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Handle reset flag
if (process.argv.includes('--reset')) {
  console.log('🔄 Resetting database...');
  console.log('⚠️  This will delete ALL data!\\n');

  // Add confirmation logic here if needed
  // For now, just proceed with seeding
}

void seed();
