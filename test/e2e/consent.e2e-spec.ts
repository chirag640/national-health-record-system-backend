import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Consent CRUD (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdConsentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Register and login to get access token
    const authRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'test-consent@example.com',
      password: 'Test123!@#',
    });
    accessToken = authRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('//consents (POST)', () => {
    it('should create a new consent', () => {
      return request(app.getHttpServer())
        .post('//consents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          scope: ['test-item'],
          expiresAt: new Date().toISOString(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('scope');
          expect(res.body).toHaveProperty('expiresAt');
          createdConsentId = res.body.id;
        });
    });

    it('should reject invalid data', () => {
      return request(app.getHttpServer())
        .post('//consents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Missing required fields
        })
        .expect(400);
    });

    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .post('//consents')
        .send({
          scope: ['test-item'],
          expiresAt: new Date().toISOString(),
        })
        .expect(401);
    });
  });

  describe('//consents (GET)', () => {
    it('should get all consents', () => {
      return request(app.getHttpServer())
        .get('//consents')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('//consents?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('//consents/:id (GET)', () => {
    it('should get a single consent by id', () => {
      return request(app.getHttpServer())
        .get(`//consents/${createdConsentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdConsentId);
        });
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .get('//consents/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('//consents/:id (PATCH)', () => {
    it('should update a consent', () => {
      return request(app.getHttpServer())
        .patch(`//consents/${createdConsentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdConsentId);
        });
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .patch('//consents/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(404);
    });
  });

  describe('//consents/:id (DELETE)', () => {
    it('should delete a consent', () => {
      return request(app.getHttpServer())
        .delete(`//consents/${createdConsentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should return 404 when deleting non-existent id', () => {
      return request(app.getHttpServer())
        .delete('//consents/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
