import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('HealthDocument CRUD (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdHealthDocumentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Register and login to get access token
    const authRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'test-healthDocument@example.com',
      password: 'Test123!@#',
    });
    accessToken = authRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('//healthdocuments (POST)', () => {
    it('should create a new healthDocument', () => {
      return request(app.getHttpServer())
        .post('//healthdocuments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          docType: 'test-docType',
          fileUrl: 'test-fileUrl',
          metadata: { test: 'data' },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('docType');
          expect(res.body).toHaveProperty('fileUrl');
          expect(res.body).toHaveProperty('metadata');
          createdHealthDocumentId = res.body.id;
        });
    });

    it('should reject invalid data', () => {
      return request(app.getHttpServer())
        .post('//healthdocuments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Missing required fields
        })
        .expect(400);
    });

    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .post('//healthdocuments')
        .send({
          docType: 'test-docType',
          fileUrl: 'test-fileUrl',
        })
        .expect(401);
    });
  });

  describe('//healthdocuments (GET)', () => {
    it('should get all healthdocuments', () => {
      return request(app.getHttpServer())
        .get('//healthdocuments')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('//healthdocuments?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('//healthdocuments/:id (GET)', () => {
    it('should get a single healthDocument by id', () => {
      return request(app.getHttpServer())
        .get(`//healthdocuments/${createdHealthDocumentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdHealthDocumentId);
        });
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .get('//healthdocuments/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('//healthdocuments/:id (PATCH)', () => {
    it('should update a healthDocument', () => {
      return request(app.getHttpServer())
        .patch(`//healthdocuments/${createdHealthDocumentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          docType: 'updated-docType',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdHealthDocumentId);
        });
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .patch('//healthdocuments/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(404);
    });
  });

  describe('//healthdocuments/:id (DELETE)', () => {
    it('should delete a healthDocument', () => {
      return request(app.getHttpServer())
        .delete(`//healthdocuments/${createdHealthDocumentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should return 404 when deleting non-existent id', () => {
      return request(app.getHttpServer())
        .delete('//healthdocuments/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
