import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';

/**
 * Base test utilities for healthcare application
 */

let mongoServer: MongoMemoryServer;

/**
 * Create in-memory MongoDB server for testing
 */
export async function createTestDatabase(): Promise<string> {
  mongoServer = await MongoMemoryServer.create();
  return mongoServer.getUri();
}

/**
 * Close in-memory MongoDB server
 */
export async function closeTestDatabase(): Promise<void> {
  if (mongoServer) {
    await mongoServer.stop();
  }
}

/**
 * Create a test module with common configuration
 */
export async function createTestModule(
  imports: any[] = [],
  providers: any[] = [],
  controllers: any[] = [],
): Promise<TestingModule> {
  const mongoUri = await createTestDatabase();

  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      MongooseModule.forRoot(mongoUri),
      ...imports,
    ],
    providers,
    controllers,
  }).compile();
}

/**
 * Create a test application instance
 */
export async function createTestApp(module: TestingModule): Promise<INestApplication> {
  const app = module.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

/**
 * Test factory for creating test data
 */
export class TestFactory {
  /**
   * Create a test user payload
   */
  static createUserPayload(overrides: Partial<any> = {}): any {
    return {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'patient',
      ...overrides,
    };
  }

  /**
   * Create a test patient payload
   */
  static createPatientPayload(overrides: Partial<any> = {}): any {
    return {
      dateOfBirth: '1990-01-15',
      gender: 'male',
      phone: '+919876543210',
      address: {
        street: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      },
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '+919876543211',
        relationship: 'spouse',
      },
      bloodGroup: 'O+',
      ...overrides,
    };
  }

  /**
   * Create a test doctor payload
   */
  static createDoctorPayload(overrides: Partial<any> = {}): any {
    return {
      specialization: 'General Medicine',
      licenseNumber: `LIC${Date.now()}`,
      qualifications: ['MBBS', 'MD'],
      experience: 10,
      consultationFee: 500,
      ...overrides,
    };
  }

  /**
   * Create a test prescription payload
   */
  static createPrescriptionPayload(overrides: Partial<any> = {}): any {
    return {
      medicationName: 'Paracetamol',
      genericName: 'Acetaminophen',
      dosage: {
        value: 500,
        unit: 'mg',
      },
      frequency: 'Twice daily',
      duration: '7 days',
      instructions: 'Take after meals',
      ...overrides,
    };
  }

  /**
   * Create a test appointment payload
   */
  static createAppointmentPayload(overrides: Partial<any> = {}): any {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    return {
      appointmentDate: futureDate.toISOString(),
      duration: 30,
      type: 'consultation',
      notes: 'Regular checkup',
      ...overrides,
    };
  }
}

/**
 * Mock JWT tokens for testing
 */
export class TestAuth {
  /**
   * Generate a mock access token header
   */
  static getAuthHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Mock user payload for JWT
   */
  static createMockUserPayload(role: string = 'patient'): any {
    return {
      sub: `test-user-${Date.now()}`,
      email: 'test@example.com',
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
  }
}

/**
 * Assert helpers for common test scenarios
 */
export class TestAssert {
  /**
   * Assert response has pagination structure
   */
  static assertPagination(body: any): void {
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
    expect(body.meta).toHaveProperty('total');
    expect(body.meta).toHaveProperty('page');
    expect(body.meta).toHaveProperty('limit');
    expect(body.meta).toHaveProperty('totalPages');
  }

  /**
   * Assert response is a valid error response
   */
  static assertError(body: any, statusCode: number): void {
    expect(body).toHaveProperty('statusCode', statusCode);
    expect(body).toHaveProperty('message');
  }

  /**
   * Assert timestamp fields exist and are valid
   */
  static assertTimestamps(body: any): void {
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('updatedAt');
    expect(new Date(body.createdAt)).toBeInstanceOf(Date);
    expect(new Date(body.updatedAt)).toBeInstanceOf(Date);
  }
}

/**
 * E2E test helpers
 */
export class E2ETestHelper {
  private app: INestApplication;
  private accessToken: string;

  constructor(app: INestApplication) {
    this.app = app;
  }

  /**
   * Register and login a test user
   */
  async authenticateUser(
    email?: string,
    password: string = 'TestPassword123!',
    role: string = 'patient',
  ): Promise<string> {
    const userEmail = email || `test-${Date.now()}@example.com`;

    // Register
    await request(this.app.getHttpServer()).post('/auth/register').send({
      email: userEmail,
      password,
      firstName: 'Test',
      lastName: 'User',
      role,
    });

    // Login
    const loginResponse = await request(this.app.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password });

    this.accessToken = loginResponse.body.accessToken;
    return this.accessToken;
  }

  /**
   * Make authenticated GET request
   */
  async get(url: string): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .get(url)
      .set('Authorization', `Bearer ${this.accessToken}`);
  }

  /**
   * Make authenticated POST request
   */
  async post(url: string, body: any): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .post(url)
      .set('Authorization', `Bearer ${this.accessToken}`)
      .send(body);
  }

  /**
   * Make authenticated PATCH request
   */
  async patch(url: string, body: any): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .patch(url)
      .set('Authorization', `Bearer ${this.accessToken}`)
      .send(body);
  }

  /**
   * Make authenticated DELETE request
   */
  async delete(url: string): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .delete(url)
      .set('Authorization', `Bearer ${this.accessToken}`);
  }
}
