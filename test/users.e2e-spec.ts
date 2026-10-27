import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { Gender, UserRole } from '../src/users/users.enums';
import { createTestApp, testRequest } from './test-app';

type UserResponse = {
  id: string;
  email: string;
  name: string;
  city: string;
  about: string;
  role: UserRole;
  password?: string;
  refreshToken?: string;
};

describe('Users (e2e)', () => {
  let app: INestApplication<App>;

  const password = 'password123';

  const uniqueEmail = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

  const register = async (prefix: string) => {
    const email = uniqueEmail(prefix);
    const response = await testRequest(app).post('/auth/register').send({
      name: 'Иван',
      email,
      password,
      about: 'Немного о себе',
      birthdate: '1995-05-20',
      city: 'Москва',
      gender: Gender.MALE,
    });
    const { accessToken } = response.body as { accessToken: string };
    return { email, accessToken };
  };

  const getMe = (accessToken: string) =>
    testRequest(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('без авторизации возвращает список пользователей без секретных полей', async () => {
      const { email } = await register('users-list');

      const response = await testRequest(app).get('/users');

      expect(response.status).toBe(200);
      const users = response.body as UserResponse[];
      const user = users.find((u) => u.email === email);
      expect(user).toBeDefined();
      for (const u of users) {
        expect(u).not.toHaveProperty('password');
        expect(u).not.toHaveProperty('refreshToken');
      }
    });
  });

  describe('GET /users/me', () => {
    it('возвращает профиль текущего пользователя', async () => {
      const { email, accessToken } = await register('users-me');

      const response = await getMe(accessToken);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        email,
        name: 'Иван',
        role: UserRole.USER,
      });
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('возвращает 401 без токена', async () => {
      const response = await testRequest(app).get('/users/me');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /users/me', () => {
    it('обновляет данные профиля', async () => {
      const { accessToken } = await register('users-update');

      const response = await testRequest(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Пётр', city: 'Казань', about: 'Люблю шахматы' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: 'Пётр',
        city: 'Казань',
        about: 'Люблю шахматы',
      });
      expect(response.body).not.toHaveProperty('password');
      const me = await getMe(accessToken);
      expect(me.body).toMatchObject({ name: 'Пётр', city: 'Казань' });
    });

    it('не даёт поменять себе роль', async () => {
      const { accessToken } = await register('users-role');

      const response = await testRequest(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ role: UserRole.ADMIN });

      expect(response.status).toBe(400);
      const me = await getMe(accessToken);
      expect((me.body as UserResponse).role).toBe(UserRole.USER);
    });

    it('возвращает 400 при невалидных данных', async () => {
      const { accessToken } = await register('users-invalid');

      const response = await testRequest(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'a', gender: 'UNKNOWN' });

      expect(response.status).toBe(400);
    });

    it('возвращает 401 без токена', async () => {
      const response = await testRequest(app)
        .patch('/users/me')
        .send({ name: 'Пётр' });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /users/me/password', () => {
    it('меняет пароль: вход с новым паролем работает, со старым — нет', async () => {
      const { email, accessToken } = await register('users-password');
      const newPassword = 'newPassword456';

      const response = await testRequest(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ oldPassword: password, newPassword });

      expect(response.status).toBe(204);
      const loginWithNew = await testRequest(app)
        .post('/auth/login')
        .send({ email, password: newPassword });
      expect(loginWithNew.status).toBe(200);
      const loginWithOld = await testRequest(app)
        .post('/auth/login')
        .send({ email, password });
      expect(loginWithOld.status).toBe(401);
    });

    it('возвращает 401 при неверном старом пароле', async () => {
      const { accessToken } = await register('users-wrong-password');

      const response = await testRequest(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ oldPassword: 'wrongPassword', newPassword: 'newPassword456' });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        message: 'Неверный старый пароль',
      });
    });

    it('возвращает 400 для слишком короткого нового пароля', async () => {
      const { accessToken } = await register('users-short-password');

      const response = await testRequest(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ oldPassword: password, newPassword: '123' });

      expect(response.status).toBe(400);
    });

    it('возвращает 401 без токена', async () => {
      const response = await testRequest(app)
        .patch('/users/me/password')
        .send({ oldPassword: password, newPassword: 'newPassword456' });

      expect(response.status).toBe(401);
    });
  });
});
