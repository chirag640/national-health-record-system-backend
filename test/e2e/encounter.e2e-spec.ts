import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Encounter CRUD (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdEncounterId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Register and login to get access token
    const authRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'test-encounter@example.com',
      password: 'Test123!@#',
    });
    accessToken = authRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('//encounters (POST)', () => {
    it('should create a new encounter', () => {
      return request(app.getHttpServer())
        .post('//encounters')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          visitReason: 'test-visitReason',
          diagnosis: 'test-diagnosis',
          prescriptions: { test: 'data' },
          vitals: { test: 'data' },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('visitReason');
          expect(res.body).toHaveProperty('diagnosis');
          expect(res.body).toHaveProperty('prescriptions');
          expect(res.body).toHaveProperty('vitals');
          createdEncounterId = res.body.id;
        });
    });

    it('should reject invalid data', () => {
      return request(app.getHttpServer())
        .post('//encounters')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Missing required fields
        })
        .expect(400);
    });

    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .post('//encounters')
        .send({
          visitReason: 'test-visitReason',
        })
        .expect(401);
    });
  });

  describe('//encounters (GET)', () => {
    it('should get all encounters', () => {
      return request(app.getHttpServer())
        .get('//encounters')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('//encounters?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('//encounters/:id (GET)', () => {
    it('should get a single encounter by id', () => {
      return request(app.getHttpServer())
        .get(`//encounters/${createdEncounterId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdEncounterId);
        });
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .get('//encounters/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('//encounters/:id (PATCH)', () => {
    it('should update a encounter', () => {
      return request(app.getHttpServer())
        .patch(`//encounters/${createdEncounterId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          visitReason: 'updated-visitReason',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdEncounterId);
        });
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .patch('//encounters/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(404);
    });
  });

  describe('//encounters/:id (DELETE)', () => {
    it('should delete a encounter', () => {
      return request(app.getHttpServer())
        .delete(`//encounters/${createdEncounterId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should return 404 when deleting non-existent id', () => {
      return request(app.getHttpServer())
        .delete('//encounters/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
