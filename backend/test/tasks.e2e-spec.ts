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

/** Helper: register + verify email, returns cookie */
async function registerAndGetCookie(
  app: INestApplication,
  userModel: Model<UserDocument>,
  userData: { name: string; email: string; password: string },
): Promise<string[]> {
  await request(app.getHttpServer()).post('/auth/register').send(userData);

  const user = await userModel.findOne({ email: userData.email });

  const verifyRes = await request(app.getHttpServer())
    .post('/auth/verify-email')
    .send({ email: userData.email, code: user!.verificationCode });

  return verifyRes.headers['set-cookie'];
}

describe('Tasks (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let userModel: Model<UserDocument>;
  let cookie: string[];
  let boardId: string;
  let taskId: string;

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

    cookie = await registerAndGetCookie(app, userModel, {
      name: 'Task Test User',
      email: 'tasktest@example.com',
      password: 'password123',
    });

    const boardRes = await request(app.getHttpServer())
      .post('/boards')
      .set('Cookie', cookie)
      .send({ title: 'Test Board', description: 'Board for task tests' });
    boardId = boardRes.body._id;
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe('POST /boards/:boardId/tasks', () => {
    it('should create a task', async () => {
      const response = await request(app.getHttpServer())
        .post(`/boards/${boardId}/tasks`)
        .set('Cookie', cookie)
        .send({ title: 'Test Task', description: 'A test task' })
        .expect(201);

      expect(response.body.title).toBe('Test Task');
      expect(response.body.status).toBe('todo');
      expect(response.body.position).toBe(0);
      taskId = response.body._id;
    });

    it('should auto-increment position', async () => {
      const response = await request(app.getHttpServer())
        .post(`/boards/${boardId}/tasks`)
        .set('Cookie', cookie)
        .send({ title: 'Second Task' })
        .expect(201);

      expect(response.body.position).toBe(1);
    });
  });

  describe('GET /boards/:boardId/tasks', () => {
    it('should get all tasks', async () => {
      const response = await request(app.getHttpServer())
        .get(`/boards/${boardId}/tasks`)
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PATCH /boards/:boardId/tasks/:taskId', () => {
    it('should update a task', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/boards/${boardId}/tasks/${taskId}`)
        .set('Cookie', cookie)
        .send({ title: 'Updated Task', status: 'in-progress' })
        .expect(200);

      expect(response.body.title).toBe('Updated Task');
      expect(response.body.status).toBe('in-progress');
    });
  });

  describe('DELETE /boards/:boardId/tasks/:taskId', () => {
    it('should delete a task', async () => {
      await request(app.getHttpServer())
        .delete(`/boards/${boardId}/tasks/${taskId}`)
        .set('Cookie', cookie)
        .expect(200);
    });
  });

  describe('Access control', () => {
    it('should deny access to another user\'s board', async () => {
      const otherCookie = await registerAndGetCookie(app, userModel, {
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      await request(app.getHttpServer())
        .get(`/boards/${boardId}/tasks`)
        .set('Cookie', otherCookie)
        .expect(403);
    });

    it('should deny unauthenticated access', async () => {
      await request(app.getHttpServer())
        .get(`/boards/${boardId}/tasks`)
        .expect(401);
    });
  });
});
