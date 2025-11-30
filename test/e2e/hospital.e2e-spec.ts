import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Hospital CRUD (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdHospitalId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Register and login to get access token
    const authRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'test-hospital@example.com',
      password: 'Test123!@#',
    });
    accessToken = authRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('//hospitals (POST)', () => {
    it('should create a new hospital', () => {
      return request(app.getHttpServer())
        .post('//hospitals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'test-name',
          state: 'test-state',
          district: 'test-district',
          hospitalType: 'Government',
          isActive: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('state');
          expect(res.body).toHaveProperty('district');
          expect(res.body).toHaveProperty('hospitalType');
          expect(res.body).toHaveProperty('isActive');
          createdHospitalId = res.body.id;
        });
    });

    it('should reject invalid data', () => {
      return request(app.getHttpServer())
        .post('//hospitals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Missing required fields
        })
        .expect(400);
    });

    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .post('//hospitals')
        .send({
          name: 'test-name',
          state: 'test-state',
          district: 'test-district',
          hospitalType: 'Government',
        })
        .expect(401);
    });
  });

  describe('//hospitals (GET)', () => {
    it('should get all hospitals', () => {
      return request(app.getHttpServer())
        .get('//hospitals')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('//hospitals?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('//hospitals/:id (GET)', () => {
    it('should get a single hospital by id', () => {
      return request(app.getHttpServer())
        .get(`//hospitals/${createdHospitalId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdHospitalId);
        });
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .get('//hospitals/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('//hospitals/:id (PATCH)', () => {
    it('should update a hospital', () => {
      return request(app.getHttpServer())
        .patch(`//hospitals/${createdHospitalId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'updated-name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdHospitalId);
        });
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .patch('//hospitals/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(404);
    });
  });

  describe('//hospitals/:id (DELETE)', () => {
    it('should delete a hospital', () => {
      return request(app.getHttpServer())
        .delete(`//hospitals/${createdHospitalId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should return 404 when deleting non-existent id', () => {
      return request(app.getHttpServer())
        .delete('//hospitals/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
