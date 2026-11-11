import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { Category } from '../src/categories/entities/category.entity';
import { User } from '../src/users/entities/user.entity';
import { Gender, UserRole } from '../src/users/users.enums';
import { createTestApp, testRequest } from './test-app';

type CategoryResponse = {
  id: string;
  name: string;
  parent?: { id: string } | null;
  children?: CategoryResponse[];
};

describe('Categories (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  const createdIds: string[] = [];

  const password = 'password123';
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
    const { email } = await register('categories-admin');
    await dataSource
      .getRepository(User)
      .update({ email }, { role: UserRole.ADMIN });
    const response = await testRequest(app)
      .post('/auth/login')
      .send({ email, password });
    return (response.body as { accessToken: string }).accessToken;
  };

  const createCategory = async (body: object) => {
    const response = await testRequest(app)
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body);
    const category = response.body as CategoryResponse;
    if (category.id) {
      createdIds.push(category.id);
    }
    return response;
  };

  const getRootCategories = async () => {
    const response = await testRequest(app).get('/categories');
    expect(response.status).toBe(200);
    return response.body as CategoryResponse[];
  };

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    adminToken = await loginAsAdmin();
    ({ accessToken: userToken } = await register('categories-user'));
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await dataSource.getRepository(Category).delete(createdIds);
    }
    if (dataSource) {
      await dataSource
        .getRepository(User)
        .delete([
          { email: `categories-admin-${suffix}@example.com` },
          { email: `categories-user-${suffix}@example.com` },
        ]);
    }
    await app.close();
  });

  describe('POST /categories', () => {
    it('администратор создаёт основную категорию', async () => {
      const name = uniqueName('Музыка');

      const response = await createCategory({ name });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ name });
      expect((response.body as CategoryResponse).id).toBeDefined();
    });

    it('администратор создаёт подкатегорию с parentId', async () => {
      const parent = (await createCategory({ name: uniqueName('Спорт') }))
        .body as CategoryResponse;

      const response = await createCategory({
        name: uniqueName('Футбол'),
        parentId: parent.id,
      });

      expect(response.status).toBe(201);
      expect((response.body as CategoryResponse).parent?.id).toBe(parent.id);
    });

    it('возвращает 404, если родительская категория не найдена', async () => {
      const response = await createCategory({
        name: uniqueName('Сирота'),
        parentId: randomUUID(),
      });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        message: 'Родительская категория не найдена',
      });
    });

    it('возвращает 400 при невалидном теле', async () => {
      const response = await createCategory({ name: 'a' });

      expect(response.status).toBe(400);
    });

    it('возвращает 401 без токена', async () => {
      const response = await testRequest(app)
        .post('/categories')
        .send({ name: uniqueName('Без токена') });

      expect(response.status).toBe(401);
    });

    it('возвращает 403 для обычного пользователя', async () => {
      const response = await testRequest(app)
        .post('/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: uniqueName('Не админ') });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ message: 'Недостаточно прав' });
    });
  });

  describe('GET /categories', () => {
    it('без авторизации возвращает основные категории с подкатегориями', async () => {
      const parent = (await createCategory({ name: uniqueName('Языки') }))
        .body as CategoryResponse;
      const child = (
        await createCategory({
          name: uniqueName('Английский'),
          parentId: parent.id,
        })
      ).body as CategoryResponse;

      const categories = await getRootCategories();

      const foundParent = categories.find((c) => c.id === parent.id);
      expect(foundParent).toBeDefined();
      expect(foundParent?.children?.map((c) => c.id)).toContain(child.id);
      expect(categories.map((c) => c.id)).not.toContain(child.id);
    });
  });

  describe('PATCH /categories/:id', () => {
    it('возвращает 400 при назначении самой себя родителем и сохраняет категорию в корне', async () => {
      const name = uniqueName('Корневая');
      const category = (await createCategory({ name }))
        .body as CategoryResponse;

      await testRequest(app)
        .patch(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ parentId: category.id, name: uniqueName('Не сохранять') })
        .expect(400);

      const stored = await dataSource.getRepository(Category).findOne({
        where: { id: category.id },
        relations: { parent: true },
      });
      expect(stored?.parent).toBeNull();
      expect(stored?.name).toBe(name);
      expect((await getRootCategories()).map((item) => item.id)).toContain(
        category.id,
      );
    });

    it.each([1, 3])(
      'возвращает 400 при назначении потомка с глубиной %i родителем',
      async (depth) => {
        const root = (
          await createCategory({ name: uniqueName(`Дерево ${depth}`) })
        ).body as CategoryResponse;
        let descendant = root;
        for (let level = 1; level <= depth; level++) {
          descendant = (
            await createCategory({
              name: uniqueName(`Уровень ${depth}-${level}`),
              parentId: descendant.id,
            })
          ).body as CategoryResponse;
        }

        await testRequest(app)
          .patch(`/categories/${root.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ parentId: descendant.id })
          .expect(400);

        const stored = await dataSource.getRepository(Category).findOne({
          where: { id: root.id },
          relations: { parent: true },
        });
        expect(stored?.parent).toBeNull();
        expect((await getRootCategories()).map((item) => item.id)).toContain(
          root.id,
        );
      },
    );

    it('разрешает перенос подкатегории выше, если цикл не возникает', async () => {
      const root = (await createCategory({ name: uniqueName('Без цикла') }))
        .body as CategoryResponse;
      const child = (
        await createCategory({ name: uniqueName('Ветка'), parentId: root.id })
      ).body as CategoryResponse;
      const leaf = (
        await createCategory({ name: uniqueName('Лист'), parentId: child.id })
      ).body as CategoryResponse;

      const response = await testRequest(app)
        .patch(`/categories/${leaf.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ parentId: root.id })
        .expect(200);

      expect(response.body).toMatchObject({ parent: { id: root.id } });
    });

    it('администратор переименовывает категорию', async () => {
      const category = (await createCategory({ name: uniqueName('Старое') }))
        .body as CategoryResponse;
      const name = uniqueName('Новое');

      const response = await testRequest(app)
        .patch(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id: category.id, name });
    });

    it('parentId: null делает подкатегорию основной', async () => {
      const parent = (await createCategory({ name: uniqueName('Хобби') }))
        .body as CategoryResponse;
      const child = (
        await createCategory({
          name: uniqueName('Вязание'),
          parentId: parent.id,
        })
      ).body as CategoryResponse;

      const response = await testRequest(app)
        .patch(`/categories/${child.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ parentId: null });

      expect(response.status).toBe(200);
      const categories = await getRootCategories();
      expect(categories.map((c) => c.id)).toContain(child.id);
    });

    it('возвращает 404 для несуществующей категории', async () => {
      const response = await testRequest(app)
        .patch(`/categories/${randomUUID()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: uniqueName('Нет такой') });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({ message: 'Категория не найдена' });
    });

    it('возвращает 403 для обычного пользователя', async () => {
      const category = (await createCategory({ name: uniqueName('Чужая') }))
        .body as CategoryResponse;

      const response = await testRequest(app)
        .patch(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: uniqueName('Взлом') });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('администратор удаляет категорию вместе с подкатегориями', async () => {
      const parent = (await createCategory({ name: uniqueName('Удаляемая') }))
        .body as CategoryResponse;
      const child = (
        await createCategory({
          name: uniqueName('Дочерняя'),
          parentId: parent.id,
        })
      ).body as CategoryResponse;

      const response = await testRequest(app)
        .delete(`/categories/${parent.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
      const categories = await getRootCategories();
      expect(categories.map((c) => c.id)).not.toContain(parent.id);
      const orphan = await dataSource
        .getRepository(Category)
        .findOneBy({ id: child.id });
      expect(orphan).toBeNull();
    });

    it('возвращает 404 для несуществующей категории', async () => {
      const response = await testRequest(app)
        .delete(`/categories/${randomUUID()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('возвращает 403 для обычного пользователя', async () => {
      const category = (
        await createCategory({ name: uniqueName('Защищённая') })
      ).body as CategoryResponse;

      const response = await testRequest(app)
        .delete(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});
