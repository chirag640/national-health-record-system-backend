import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email', 'test@example.com');
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should reject duplicate email', async () => {
      // Register first user
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'duplicate@example.com',
        password: 'Test123!@#',
        firstName: 'Duplicate',
        lastName: 'Test',
      });

      // Try to register with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Test123!@#',
          firstName: 'Duplicate',
          lastName: 'Test',
        })
        .expect(400);
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
          firstName: 'Invalid',
          lastName: 'Email',
        })
        .expect(400);
    });

    it('should reject weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'weak@example.com',
          password: '123',
          firstName: 'Weak',
          lastName: 'Password',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeAll(async () => {
      // Register a user to login with
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'login@example.com',
        password: 'Test123!@#',
        firstName: 'Login',
        lastName: 'User',
      });
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Test123!@#',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          accessToken = res.body.accessToken;
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrong-password',
        })
        .expect(401);
    });

    it('should reject non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!@#',
        })
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', 'login@example.com');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('RBAC', () => {
    let adminToken: string;
    let userToken: string;

    beforeAll(async () => {
      // Register admin
      const adminRes = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'admin@example.com',
        password: 'Test123!@#',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      });
      adminToken = adminRes.body.accessToken;

      // Register regular user
      const userRes = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'user@example.com',
        password: 'Test123!@#',
        firstName: 'Regular',
        lastName: 'User',
        role: 'user',
      });
      userToken = userRes.body.accessToken;
    });

    it('should allow admin to access admin routes', () => {
      return request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should deny user access to admin routes', () => {
      return request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
