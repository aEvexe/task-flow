import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ConfigModule } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { Model } from 'mongoose';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { BoardsModule } from '../src/boards/boards.module';
import { TasksModule } from '../src/tasks/tasks.module';
import { User, UserDocument } from '../src/users/user.schema';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let userModel: Model<UserDocument>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              nodeEnv: 'test',
              isProduction: false,
              port: 3000,
              baseUrl: 'http://localhost:3000',
              mongoUri: uri,
              jwtSecret: 'test-secret-key',
              jwtRefreshSecret: 'test-refresh-secret',
              smtp: { user: '', pass: '' },
              googleClientId: '',
              googleClientSecret: '',
              googleCallbackUrl: 'http://localhost:3000/auth/google/callback',
              frontendUrl: 'http://localhost:5173',
            }),
          ],
        }),
        MongooseModule.forRoot(uri),
        AuthModule,
        UsersModule,
        BoardsModule,
        TasksModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  const testUser = { name: 'Test User', email: 'test@example.com', password: 'password123' };

  describe('POST /auth/register', () => {
    it('should create pending user and return message', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.message).toContain('Verification code sent');
      expect(response.body.email).toBe(testUser.email);

      // User should exist as pending with verification code
      const user = await userModel.findOne({ email: testUser.email });
      expect(user).toBeTruthy();
      expect(user!.status).toBe('pending');
      expect(user!.verificationCode).toBeDefined();
      expect(user!.verificationCode).toHaveLength(6);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should verify email and set cookies', async () => {
      const user = await userModel.findOne({ email: testUser.email });

      const response = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ email: testUser.email, code: user!.verificationCode })
        .expect(201);

      expect(response.body.message).toBe('Email verified successfully');
      const cookies = response.headers['set-cookie'];
      expect(cookies.some((c: string) => c.startsWith('accessToken='))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith('refreshToken='))).toBe(true);

      // User should now be active
      const updated = await userModel.findOne({ email: testUser.email });
      expect(updated!.status).toBe('active');
    });

    it('should fail with invalid code', async () => {
      // Register another user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Another', email: 'another@example.com', password: 'password123' });

      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ email: 'another@example.com', code: '000000' })
        .expect(400);
    });
  });

  describe('POST /auth/register - duplicate', () => {
    it('should fail for active user', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login and set cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(201);

      expect(response.body.message).toBe('Login successful');
      const cookies = response.headers['set-cookie'];
      expect(cookies.some((c: string) => c.startsWith('accessToken='))).toBe(true);
    });

    it('should fail on wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrong' })
        .expect(401);
    });

    it('should fail for nonexistent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return user with valid cookie', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const cookie = loginRes.headers['set-cookie'];

      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookie)
        .expect(200);

      expect(meRes.body.user).toBeDefined();
      expect(meRes.body.user.email).toBe(testUser.email);
    });

    it('should return null without cookie', async () => {
      const response = await request(app.getHttpServer()).get('/auth/me').expect(200);
      expect(response.body.user).toBeNull();
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(201);

      expect(response.body.message).toBe('Logged out successfully');
      const cookies = response.headers['set-cookie'];
      expect(cookies.some((c: string) => c.includes('accessToken=;'))).toBe(true);
    });
  });

  describe('Protected routes', () => {
    it('should reject unauthenticated access', async () => {
      await request(app.getHttpServer()).get('/boards').expect(401);
    });

    it('should allow access with valid cookie', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      await request(app.getHttpServer())
        .get('/boards')
        .set('Cookie', loginRes.headers['set-cookie'])
        .expect(200);
    });
  });
});
