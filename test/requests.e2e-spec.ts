import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { Category } from '../src/categories/entities/category.entity';
import { Request } from '../src/requests/entities/request.entity';
import { RequestStatus } from '../src/requests/requests.enums';
import { Skill } from '../src/skills/entities/skill.entity';
import { User } from '../src/users/entities/user.entity';
import { Gender } from '../src/users/users.enums';
import { createTestApp, testRequest } from './test-app';

type TestUser = { id: string; accessToken: string };
type RequestResponse = {
  id: string;
  sender?: { id: string };
  receiver?: { id: string };
  offeredSkill?: { id: string };
  requestedSkill?: { id: string };
};

describe('Requests (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let category: Category;
  let sender: TestUser;
  let receiver: TestUser;
  let senderSkill: Skill;
  let receiverSkill: Skill;
  const createdUserIds: string[] = [];
  const createdSkillIds: string[] = [];
  const createdRequestIds: string[] = [];

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
    createdUserIds.push(body.user.id);
    return { id: body.user.id, accessToken: body.accessToken };
  };

  const createSkillInDb = async (owner: TestUser, title: string) => {
    const skills = dataSource.getRepository(Skill);
    const skill = await skills.save(
      skills.create({
        title,
        description: 'Научу с нуля',
        category: { id: category.id },
        owner: { id: owner.id },
      }),
    );
    createdSkillIds.push(skill.id);
    return skill;
  };

  const createRequestInDb = async (
    status: RequestStatus = RequestStatus.PENDING,
  ) => {
    const requests = dataSource.getRepository(Request);
    const saved = await requests.save(
      requests.create({
        sender: { id: sender.id },
        receiver: { id: receiver.id },
        offeredSkill: { id: senderSkill.id },
        requestedSkill: { id: receiverSkill.id },
        status,
      }),
    );
    createdRequestIds.push(saved.id);
    return saved;
  };

  const sendRequest = (
    user: TestUser,
    body: object = {
      offeredSkillId: senderSkill.id,
      requestedSkillId: receiverSkill.id,
    },
  ) =>
    testRequest(app)
      .post('/requests')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(body);

  const getList = (user: TestUser, path: 'incoming' | 'outgoing') =>
    testRequest(app)
      .get(`/requests/${path}`)
      .set('Authorization', `Bearer ${user.accessToken}`);

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    category = await dataSource
      .getRepository(Category)
      .save({ name: `Музыка ${suffix}` });
    sender = await register('requests-sender');
    receiver = await register('requests-receiver');
    senderSkill = await createSkillInDb(sender, 'Гитара');
    receiverSkill = await createSkillInDb(receiver, 'Английский');
  });

  afterEach(async () => {
    if (createdRequestIds.length > 0) {
      await dataSource.getRepository(Request).delete(createdRequestIds);
      createdRequestIds.length = 0;
    }
  });

  afterAll(async () => {
    await dataSource.getRepository(Skill).delete(createdSkillIds);
    await dataSource.getRepository(Category).delete(category.id);
    await dataSource.getRepository(User).delete(createdUserIds);
    await app.close();
  });

  describe('POST /requests', () => {
    it('создаёт заявку, получателем становится владелец запрошенного навыка', async () => {
      const response = await sendRequest(sender);

      expect(response.status).toBe(201);
      const { id } = response.body as RequestResponse;
      createdRequestIds.push(id);

      const saved = await dataSource.getRepository(Request).findOne({
        where: { id },
        relations: {
          sender: true,
          receiver: true,
          offeredSkill: true,
          requestedSkill: true,
        },
      });
      expect(saved).toMatchObject({
        status: RequestStatus.PENDING,
        isRead: false,
      });
      expect(saved?.sender.id).toBe(sender.id);
      expect(saved?.receiver.id).toBe(receiver.id);
      expect(saved?.offeredSkill.id).toBe(senderSkill.id);
      expect(saved?.requestedSkill.id).toBe(receiverSkill.id);
    });

    it('возвращает 403, если предлагается чужой навык', async () => {
      const response = await sendRequest(sender, {
        offeredSkillId: receiverSkill.id,
        requestedSkillId: receiverSkill.id,
      });

      expect(response.status).toBe(403);
    });

    it('возвращает 400, если запрошен собственный навык', async () => {
      const ownSkill = await createSkillInDb(sender, 'Рисование');

      const response = await sendRequest(sender, {
        offeredSkillId: senderSkill.id,
        requestedSkillId: ownSkill.id,
      });

      expect(response.status).toBe(400);
    });

    it('возвращает 404, если предлагаемый навык не существует', async () => {
      const response = await sendRequest(sender, {
        offeredSkillId: randomUUID(),
        requestedSkillId: receiverSkill.id,
      });

      expect(response.status).toBe(404);
    });

    it('возвращает 404, если запрошенный навык не существует', async () => {
      const response = await sendRequest(sender, {
        offeredSkillId: senderSkill.id,
        requestedSkillId: randomUUID(),
      });

      expect(response.status).toBe(404);
    });

    it('возвращает 400 при невалидных идентификаторах', async () => {
      const response = await sendRequest(sender, {
        offeredSkillId: 'not-a-uuid',
        requestedSkillId: receiverSkill.id,
      });

      expect(response.status).toBe(400);
    });

    it('возвращает 400 без обязательных полей', async () => {
      const response = await sendRequest(sender, {});

      expect(response.status).toBe(400);
    });

    it('возвращает 400 при лишних полях в теле', async () => {
      const response = await sendRequest(sender, {
        offeredSkillId: senderSkill.id,
        requestedSkillId: receiverSkill.id,
        status: RequestStatus.ACCEPTED,
      });

      expect(response.status).toBe(400);
    });

    it('возвращает 401 без токена', async () => {
      const response = await testRequest(app).post('/requests').send({
        offeredSkillId: senderSkill.id,
        requestedSkillId: receiverSkill.id,
      });

      expect(response.status).toBe(401);
    });
  });

  describe.each([
    {
      path: 'incoming' as const,
      title: 'GET /requests/incoming',
      owner: () => receiver,
      other: () => sender,
      counterpart: 'sender' as const,
    },
    {
      path: 'outgoing' as const,
      title: 'GET /requests/outgoing',
      owner: () => sender,
      other: () => receiver,
      counterpart: 'receiver' as const,
    },
  ])('$title', ({ path, owner, other, counterpart }) => {
    it('возвращает заявку с участниками и навыками', async () => {
      const created = await createRequestInDb();

      const response = await getList(owner(), path);

      expect(response.status).toBe(200);
      const items = response.body as RequestResponse[];
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(created.id);
      expect(items[0][counterpart]?.id).toBe(
        counterpart === 'sender' ? sender.id : receiver.id,
      );
      expect(items[0].offeredSkill?.id).toBe(senderSkill.id);
      expect(items[0].requestedSkill?.id).toBe(receiverSkill.id);
    });

    it('не отдаёт приватные поля пользователя', async () => {
      await createRequestInDb();

      const response = await getList(owner(), path);

      const [item] = response.body as RequestResponse[];
      expect(item[counterpart]).not.toHaveProperty('password');
      expect(item[counterpart]).not.toHaveProperty('refreshToken');
    });

    it('не показывает заявку другой стороне', async () => {
      await createRequestInDb();

      const response = await getList(other(), path);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('сортирует заявки от новых к старым', async () => {
      const older = await createRequestInDb();
      const newer = await createRequestInDb();

      const response = await getList(owner(), path);

      const ids = (response.body as RequestResponse[]).map((item) => item.id);
      expect(ids).toEqual([newer.id, older.id]);
    });

    it.each([RequestStatus.PENDING, RequestStatus.IN_PROGRESS])(
      'показывает актуальную заявку со статусом %s',
      async (status) => {
        const created = await createRequestInDb(status);

        const response = await getList(owner(), path);

        const ids = (response.body as RequestResponse[]).map((item) => item.id);
        expect(ids).toEqual([created.id]);
      },
    );

    it.each([
      RequestStatus.ACCEPTED,
      RequestStatus.REJECTED,
      RequestStatus.DONE,
    ])('скрывает завершённую заявку со статусом %s', async (status) => {
      await createRequestInDb(status);

      const response = await getList(owner(), path);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('возвращает 401 без токена', async () => {
      const response = await testRequest(app).get(`/requests/${path}`);

      expect(response.status).toBe(401);
    });
  });
});
