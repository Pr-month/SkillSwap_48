import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { Category } from '../src/categories/entities/category.entity';
import { Skill } from '../src/skills/entities/skill.entity';
import { Gender } from '../src/users/users.enums';
import { createTestApp, testRequest } from './test-app';

type SkillResponse = { id: string; title: string; description: string };
type TestUser = { id: string; accessToken: string };

describe('Skills (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let category: Category;
  let otherCategory: Category;
  let owner: TestUser;
  let stranger: TestUser;
  const createdSkillIds: string[] = [];

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const register = async (prefix: string): Promise<TestUser> => {
    const response = await testRequest(app)
      .post('/auth/register')
      .send({
        name: 'Иван',
        email: `${prefix}-${suffix}@example.com`,
        password: 'password123',
        about: 'Немного о себе',
        birthdate: '1995-05-20',
        city: 'Москва',
        gender: Gender.MALE,
      });
    const body = response.body as {
      user: { id: string };
      accessToken: string;
    };
    return { id: body.user.id, accessToken: body.accessToken };
  };

  const createSkill = async (
    user: TestUser,
    body: object = {
      title: 'Гитара',
      description: 'Научу играть аккорды',
      category: category.id,
    },
  ) => {
    const response = await testRequest(app)
      .post('/skills')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(body);
    const skill = response.body as SkillResponse;
    if (skill.id) {
      createdSkillIds.push(skill.id);
    }
    return response;
  };

  const createSkillOk = async (user: TestUser, categoryId = category.id) => {
    const response = await createSkill(user, {
      title: 'Гитара',
      description: 'Научу играть аккорды',
      category: categoryId,
    });
    expect(response.status).toBe(201);
    return response.body as SkillResponse;
  };

  const findSkillInDb = (id: string) =>
    dataSource.getRepository(Skill).findOne({
      where: { id },
      relations: { owner: true },
    });

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    const categories = dataSource.getRepository(Category);
    category = await categories.save({ name: `Музыка ${suffix}` });
    otherCategory = await categories.save({ name: `Спорт ${suffix}` });
    owner = await register('skills-owner');
    stranger = await register('skills-stranger');
  });

  afterAll(async () => {
    if (createdSkillIds.length > 0) {
      await dataSource.getRepository(Skill).delete(createdSkillIds);
    }
    await dataSource
      .getRepository(Category)
      .delete([category.id, otherCategory.id]);
    await app.close();
  });

  describe('POST /skills', () => {
    it('создаёт навык, владельцем становится текущий пользователь', async () => {
      const response = await createSkill(owner);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: 'Гитара',
        description: 'Научу играть аккорды',
      });
      const saved = await findSkillInDb((response.body as SkillResponse).id);
      expect(saved?.owner.id).toBe(owner.id);
    });

    it('возвращает 400 без категории', async () => {
      const response = await createSkill(owner, {
        title: 'Гитара',
        description: 'Научу играть аккорды',
      });

      expect(response.status).toBe(400);
    });

    it('возвращает 400 для несуществующей категории', async () => {
      const response = await createSkill(owner, {
        title: 'Гитара',
        description: 'Научу играть аккорды',
        category: randomUUID(),
      });

      expect(response.status).toBe(400);
    });

    it('возвращает 401 без токена', async () => {
      const response = await testRequest(app).post('/skills').send({
        title: 'Гитара',
        description: 'Научу играть аккорды',
        category: category.id,
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /skills', () => {
    it('без авторизации возвращает страницу навыков с метаданными пагинации', async () => {
      await createSkillOk(owner);
      await createSkillOk(owner);
      await createSkillOk(owner);

      const response = await testRequest(app)
        .get('/skills')
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      const body = response.body as {
        data: SkillResponse[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
      expect(body.page).toBe(1);
      expect(body.limit).toBe(2);
      expect(body.data).toHaveLength(2);
      expect(body.total).toBeGreaterThanOrEqual(3);
      expect(body.totalPages).toBe(Math.ceil(body.total / 2));
    });

    it.each([{ limit: 0 }, { limit: 101 }, { page: 0 }, { page: 'abc' }])(
      'возвращает 400 для невалидных параметров %o',
      async (query) => {
        const response = await testRequest(app).get('/skills').query(query);

        expect(response.status).toBe(400);
      },
    );
  });

  describe('GET /skills/:id/similar', () => {
    it('возвращает других пользователей с навыками из той же категории', async () => {
      const sameCategoryUser = await register('skills-similar');
      const otherCategoryUser = await register('skills-other-category');
      const skill = await createSkillOk(owner);
      await createSkillOk(sameCategoryUser);
      await createSkillOk(otherCategoryUser, otherCategory.id);

      const response = await testRequest(app)
        .get(`/skills/${skill.id}/similar`)
        .set('Authorization', `Bearer ${stranger.accessToken}`);

      expect(response.status).toBe(200);
      const users = response.body as Array<{ id: string }>;
      const ids = users.map((u) => u.id);
      expect(ids).toContain(sameCategoryUser.id);
      expect(ids).not.toContain(owner.id);
      expect(ids).not.toContain(otherCategoryUser.id);
      for (const user of users) {
        expect(user).not.toHaveProperty('password');
      }
    });

    it('возвращает 404 для несуществующего навыка', async () => {
      const response = await testRequest(app)
        .get(`/skills/${randomUUID()}/similar`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(404);
    });

    it('возвращает 401 без токена', async () => {
      const response = await testRequest(app).get(
        `/skills/${randomUUID()}/similar`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /skills/:id', () => {
    it('владелец обновляет навык', async () => {
      const skill = await createSkillOk(owner);

      const response = await testRequest(app)
        .patch(`/skills/${skill.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ title: 'Электрогитара' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: skill.id,
        title: 'Электрогитара',
      });
    });

    it('возвращает 403 при попытке изменить чужой навык', async () => {
      const skill = await createSkillOk(owner);

      const response = await testRequest(app)
        .patch(`/skills/${skill.id}`)
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .send({ title: 'Чужое' });

      expect(response.status).toBe(403);
      const saved = await findSkillInDb(skill.id);
      expect(saved?.title).toBe('Гитара');
    });

    it('возвращает 404 для несуществующего навыка', async () => {
      const response = await testRequest(app)
        .patch(`/skills/${randomUUID()}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ title: 'Нет такого' });

      expect(response.status).toBe(404);
    });

    it('возвращает 400 для невалидного id', async () => {
      const response = await testRequest(app)
        .patch('/skills/not-a-uuid')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ title: 'Гитара' });

      expect(response.status).toBe(400);
    });

    it('возвращает 401 без токена', async () => {
      const response = await testRequest(app)
        .patch(`/skills/${randomUUID()}`)
        .send({ title: 'Гитара' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST и DELETE /skills/:id/favorite', () => {
    it('добавляет навык в избранное и удаляет из него', async () => {
      const skill = await createSkillOk(owner);
      const favorite = () =>
        testRequest(app)
          .post(`/skills/${skill.id}/favorite`)
          .set('Authorization', `Bearer ${stranger.accessToken}`);
      const unfavorite = () =>
        testRequest(app)
          .delete(`/skills/${skill.id}/favorite`)
          .set('Authorization', `Bearer ${stranger.accessToken}`);

      const added = await favorite();
      expect(added.status).toBe(200);
      expect(added.body).toMatchObject({ id: skill.id });

      const duplicate = await favorite();
      expect(duplicate.status).toBe(409);

      const removed = await unfavorite();
      expect(removed.status).toBe(204);

      const removedAgain = await unfavorite();
      expect(removedAgain.status).toBe(404);
    });

    it('возвращает 404 при добавлении несуществующего навыка', async () => {
      const response = await testRequest(app)
        .post(`/skills/${randomUUID()}/favorite`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(404);
    });

    it('возвращает 401 без токена', async () => {
      const response = await testRequest(app).post(
        `/skills/${randomUUID()}/favorite`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /skills/:id', () => {
    it('владелец удаляет навык', async () => {
      const skill = await createSkillOk(owner);

      const response = await testRequest(app)
        .delete(`/skills/${skill.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(204);
      expect(await findSkillInDb(skill.id)).toBeNull();
    });

    it('возвращает 403 при попытке удалить чужой навык', async () => {
      const skill = await createSkillOk(owner);

      const response = await testRequest(app)
        .delete(`/skills/${skill.id}`)
        .set('Authorization', `Bearer ${stranger.accessToken}`);

      expect(response.status).toBe(403);
      expect(await findSkillInDb(skill.id)).not.toBeNull();
    });

    it('возвращает 404 для несуществующего навыка', async () => {
      const response = await testRequest(app)
        .delete(`/skills/${randomUUID()}`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(404);
    });

    it('возвращает 401 без токена', async () => {
      const response = await testRequest(app).delete(`/skills/${randomUUID()}`);

      expect(response.status).toBe(401);
    });
  });
});
