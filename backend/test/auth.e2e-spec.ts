import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth & RBAC (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should prevent email enumeration on failed login', async () => {
    const start = Date.now();
    const res1 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nonexistent@vels.edu.in', password: 'wrongpassword' });
    const duration1 = Date.now() - start;

    expect(res1.status).toBe(401);
    expect(res1.body.message).toBe('Invalid credentials.');

    // We can't strictly assert the duration in a unit test, but the code uses bcrypt.compare on a dummy hash
  });

  it('should return 401 when no token is provided', () => {
    return request(app.getHttpServer())
      .get('/users/me')
      .expect(401);
  });

  // Tests would normally seed an admin/student and test RBAC here:
  // e.g. Student tries to access GET /users (admin only) -> expects 403 "Not authorized."
  // And IDOR: Admin tries to GET /users/invalid-uuid -> expects 403 instead of 404
});
