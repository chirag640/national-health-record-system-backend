import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Doctor CRUD (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdDoctorId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Register and login to get access token
    const authRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'test-doctor@example.com',
      password: 'Test123!@#',
    });
    accessToken = authRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('//doctors (POST)', () => {
    it('should create a new doctor', () => {
      return request(app.getHttpServer())
        .post('//doctors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fullName: 'test-fullName',
          phone: 'test-phone',
          specialization: 'test-specialization',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('fullName');
          expect(res.body).toHaveProperty('phone');
          expect(res.body).toHaveProperty('specialization');
          createdDoctorId = res.body.id;
        });
    });

    it('should reject invalid data', () => {
      return request(app.getHttpServer())
        .post('//doctors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Missing required fields
        })
        .expect(400);
    });

    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .post('//doctors')
        .send({
          fullName: 'test-fullName',
          phone: 'test-phone',
        })
        .expect(401);
    });
  });

  describe('//doctors (GET)', () => {
    it('should get all doctors', () => {
      return request(app.getHttpServer())
        .get('//doctors')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('//doctors?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('//doctors/:id (GET)', () => {
    it('should get a single doctor by id', () => {
      return request(app.getHttpServer())
        .get(`//doctors/${createdDoctorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdDoctorId);
        });
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .get('//doctors/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('//doctors/:id (PATCH)', () => {
    it('should update a doctor', () => {
      return request(app.getHttpServer())
        .patch(`//doctors/${createdDoctorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fullName: 'updated-fullName',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdDoctorId);
        });
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .patch('//doctors/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(404);
    });
  });

  describe('//doctors/:id (DELETE)', () => {
    it('should delete a doctor', () => {
      return request(app.getHttpServer())
        .delete(`//doctors/${createdDoctorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should return 404 when deleting non-existent id', () => {
      return request(app.getHttpServer())
        .delete('//doctors/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
