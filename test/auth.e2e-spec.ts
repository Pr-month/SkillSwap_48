import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Gender } from '../src/users/users.enums';
import { createTestApp, testRequest } from './test-app';

type AuthResponse = {
  user?: { email: string; password?: string; refreshToken?: string };
  accessToken?: string;
  refreshToken?: string;
  message?: string;
};

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  const password = 'password123';

  const uniqueEmail = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

  const registerBody = (email: string) => ({
    name: 'Иван',
    email,
    password,
    about: 'Немного о себе',
    birthdate: '1995-05-20',
    city: 'Москва',
    gender: Gender.MALE,
  });

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('регистрирует пользователя и возвращает токены', async () => {
      const email = uniqueEmail('register');
      const response = await testRequest(app)
        .post('/auth/register')
        .send(registerBody(email));

      expect(response.status).toBe(201);
      const body = response.body as AuthResponse;
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(response.body).toMatchObject({ user: { email } });
      expect(body.user).not.toHaveProperty('password');
      expect(body.user).not.toHaveProperty('refreshToken');
    });

    it('возвращает 409 при повторной регистрации', async () => {
      const email = uniqueEmail('duplicate');
      const body = registerBody(email);

      await testRequest(app).post('/auth/register').send(body);
      const response = await testRequest(app).post('/auth/register').send(body);

      expect(response.status).toBe(409);
      expect((response.body as AuthResponse).message).toBe(
        'Пользователь с таким email уже существует',
      );
    });

    it('возвращает 400 при невалидном теле', async () => {
      const response = await testRequest(app).post('/auth/register').send({
        email: 'not-an-email',
        password: '123',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('возвращает accessToken и куку для верных кредов', async () => {
      const email = uniqueEmail('login');
      await testRequest(app).post('/auth/register').send(registerBody(email));

      const agent = request.agent(app.getHttpServer());
      const response = await agent
        .post('/auth/login')
        .send({ email, password });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).not.toHaveProperty('refreshToken');
      expect(response.body).toMatchObject({ user: { email } });
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('возвращает 401 при неверном пароле', async () => {
      const email = uniqueEmail('badpass');
      await testRequest(app).post('/auth/register').send(registerBody(email));

      const response = await testRequest(app).post('/auth/login').send({
        email,
        password: 'wrong-password',
      });

      expect(response.status).toBe(401);
      expect((response.body as AuthResponse).message).toBe(
        'Неверный email или пароль',
      );
    });

    it('возвращает 401 для неизвестного email', async () => {
      const response = await testRequest(app)
        .post('/auth/login')
        .send({
          email: uniqueEmail('unknown'),
          password,
        });

      expect(response.status).toBe(401);
      expect((response.body as AuthResponse).message).toBe(
        'Неверный email или пароль',
      );
    });
  });

  describe('POST /auth/refresh', () => {
    it('обновляет токены с валидной refresh-кукой', async () => {
      const email = uniqueEmail('refresh');
      await testRequest(app).post('/auth/register').send(registerBody(email));

      const agent = request.agent(app.getHttpServer());
      const loginResponse = await agent
        .post('/auth/login')
        .send({ email, password });
      expect(loginResponse.status).toBe(200);

      const response = await agent.post('/auth/refresh');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('возвращает 401 без refresh-куки', async () => {
      const response = await testRequest(app).post('/auth/refresh');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('выходит с валидным access-токеном', async () => {
      const email = uniqueEmail('logout');
      const registerResponse = await testRequest(app)
        .post('/auth/register')
        .send(registerBody(email));
      const { accessToken } = registerResponse.body as { accessToken: string };

      const response = await testRequest(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ message: 'Вы вышли из аккаунта' });
    });

    it('возвращает 401 без access-токена', async () => {
      const response = await testRequest(app).post('/auth/logout');

      expect(response.status).toBe(401);
    });
  });
});
