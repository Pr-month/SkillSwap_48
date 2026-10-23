import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { City } from '../src/cities/entities/city.entity';
import { User } from '../src/users/entities/user.entity';
import { Gender, UserRole } from '../src/users/users.enums';
import { createTestApp, testRequest } from './test-app';

type CityResponse = { id: string; name: string };

describe('Cities (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  const createdIds: string[] = [];

  const password = 'password123';
  const suffix = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const uniqueName = (name: string) => `${name} ${suffix}`;

  const register = async (prefix: string) => {
    const email = `${prefix}-${suffix}@example.com`;
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

  const loginAsAdmin = async () => {
    const { email } = await register('cities-admin');
    await dataSource
      .getRepository(User)
      .update({ email }, { role: UserRole.ADMIN });
    const response = await testRequest(app)
      .post('/auth/login')
      .send({ email, password });
    return (response.body as { accessToken: string }).accessToken;
  };

  const createCity = async (name: string) => {
    const response = await testRequest(app)
      .post('/cities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name });
    const city = response.body as CityResponse;
    if (city.id) {
      createdIds.push(city.id);
    }
    return response;
  };

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    adminToken = await loginAsAdmin();
    ({ accessToken: userToken } = await register('cities-user'));
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await dataSource.getRepository(City).delete(createdIds);
    }
    await app.close();
  });

  describe('POST /cities', () => {
    it('администратор создаёт город, лишние пробелы обрезаются', async () => {
      const name = uniqueName('Тверь');

      const response = await createCity(`  ${name}  `);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ name });
      expect((response.body as CityResponse).id).toBeDefined();
    });

    it('возвращает 409 для города с уже существующим названием', async () => {
      const name = uniqueName('Казань');
      await createCity(name);

      const response = await createCity(name);

      expect(response.status).toBe(409);
    });

    it('возвращает 400 для пустого названия', async () => {
      const response = await createCity('   ');

      expect(response.status).toBe(400);
    });

    it('возвращает 401 без токена', async () => {
      const response = await testRequest(app)
        .post('/cities')
        .send({ name: uniqueName('Без токена') });

      expect(response.status).toBe(401);
    });

    it('возвращает 403 для обычного пользователя', async () => {
      const response = await testRequest(app)
        .post('/cities')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: uniqueName('Не админ') });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ message: 'Недостаточно прав' });
    });
  });

  describe('GET /cities', () => {
    it('без авторизации ищет города по подстроке без учёта регистра и сортирует по названию', async () => {
      await createCity(uniqueName('Пенза'));
      await createCity(uniqueName('Архангельск'));

      const response = await testRequest(app)
        .get('/cities')
        .query({ search: suffix.toUpperCase() });

      expect(response.status).toBe(200);
      const names = (response.body as CityResponse[]).map((c) => c.name);
      expect(names).toEqual(
        expect.arrayContaining([
          uniqueName('Пенза'),
          uniqueName('Архангельск'),
        ]),
      );
      expect(names.every((name) => name.includes(suffix))).toBe(true);
      expect(names.indexOf(uniqueName('Архангельск'))).toBeLessThan(
        names.indexOf(uniqueName('Пенза')),
      );
    });

    it('возвращает не больше 10 городов', async () => {
      const marker = `limit${suffix}`;
      for (let i = 0; i < 11; i++) {
        await createCity(`Город ${i} ${marker}`);
      }

      const response = await testRequest(app)
        .get('/cities')
        .query({ search: marker });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(10);
    });
  });

  describe('DELETE /cities/:id', () => {
    it('администратор удаляет город', async () => {
      const city = (await createCity(uniqueName('Удаляемый')))
        .body as CityResponse;

      const response = await testRequest(app)
        .delete(`/cities/${city.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
      const deleted = await dataSource
        .getRepository(City)
        .findOneBy({ id: city.id });
      expect(deleted).toBeNull();
    });

    it('возвращает 404 для несуществующего города', async () => {
      const response = await testRequest(app)
        .delete(`/cities/${randomUUID()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('возвращает 400 для невалидного id', async () => {
      const response = await testRequest(app)
        .delete('/cities/not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('возвращает 403 для обычного пользователя', async () => {
      const city = (await createCity(uniqueName('Защищённый')))
        .body as CityResponse;

      const response = await testRequest(app)
        .delete(`/cities/${city.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});
