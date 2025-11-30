import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Patient CRUD (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdPatientId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Register and login to get access token
    const authRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'test-patient@example.com',
      password: 'Test123!@#',
    });
    accessToken = authRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('//patients (POST)', () => {
    it('should create a new patient', () => {
      return request(app.getHttpServer())
        .post('//patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          guid: 'test-guid',
          fullName: 'test-fullName',
          phone: 'test-phone',
          gender: 'Male',
          dateOfBirth: new Date().toISOString(),
          address: { test: 'data' },
          allergies: ['test-item'],
          chronicDiseases: ['test-item'],
          bloodGroup: 'test-bloodGroup',
          emergencyContact: { test: 'data' },
          hasSmartphone: true,
          idCardIssued: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('guid');
          expect(res.body).toHaveProperty('fullName');
          expect(res.body).toHaveProperty('phone');
          expect(res.body).toHaveProperty('gender');
          expect(res.body).toHaveProperty('dateOfBirth');
          expect(res.body).toHaveProperty('address');
          expect(res.body).toHaveProperty('allergies');
          expect(res.body).toHaveProperty('chronicDiseases');
          expect(res.body).toHaveProperty('bloodGroup');
          expect(res.body).toHaveProperty('emergencyContact');
          expect(res.body).toHaveProperty('hasSmartphone');
          expect(res.body).toHaveProperty('idCardIssued');
          createdPatientId = res.body.id;
        });
    });

    it('should reject invalid data', () => {
      return request(app.getHttpServer())
        .post('//patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Missing required fields
        })
        .expect(400);
    });

    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .post('//patients')
        .send({
          guid: 'test-guid',
          fullName: 'test-fullName',
          phone: 'test-phone',
          gender: 'Male',
        })
        .expect(401);
    });
  });

  describe('//patients (GET)', () => {
    it('should get all patients', () => {
      return request(app.getHttpServer())
        .get('//patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('//patients?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('//patients/:id (GET)', () => {
    it('should get a single patient by id', () => {
      return request(app.getHttpServer())
        .get(`//patients/${createdPatientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdPatientId);
        });
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .get('//patients/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('//patients/:id (PATCH)', () => {
    it('should update a patient', () => {
      return request(app.getHttpServer())
        .patch(`//patients/${createdPatientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          guid: 'updated-guid',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdPatientId);
        });
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .patch('//patients/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(404);
    });
  });

  describe('//patients/:id (DELETE)', () => {
    it('should delete a patient', () => {
      return request(app.getHttpServer())
        .delete(`//patients/${createdPatientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should return 404 when deleting non-existent id', () => {
      return request(app.getHttpServer())
        .delete('//patients/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
