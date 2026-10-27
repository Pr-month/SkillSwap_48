import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ClassSerializerInterceptor } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { AuthRequest } from '../auth/auth.types';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { FilesService } from '../files/files.service';
import { User } from '../users/entities/user.entity';
import { Skill } from './entities/skill.entity';
import type { CreateSkillDto } from './dto/create-skill.dto';
import type { GetSkillsDto } from './dto/get-skills.dto';
import type { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

describe('SkillsController', () => {
  let controller: SkillsController;

  const skillsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findSimilar: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    remove: jest.fn(),
  };

  const userId = 'dc8387e8-703d-46c2-8ca6-240925334e9d';
  const skillId = '6f1c1f3e-6c1a-4d3b-9a43-2d6a5c1e9b10';
  const request = {
    user: {
      sub: userId,
    },
  } as unknown as AuthRequest;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [
        {
          provide: SkillsService,
          useValue: skillsService,
        },
      ],
    }).compile();

    controller = module.get<SkillsController>(SkillsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes creation data and current user id to the service', async () => {
    const dto = {
      title: 'Гитара',
      description: 'Научу играть на гитаре',
      category: '25ac8264-c483-4bee-8f43-3169e03c101c',
    } as CreateSkillDto;
    const skill = { id: skillId, ...dto };
    skillsService.create.mockResolvedValue(skill);

    const result = await controller.create(dto, request);

    expect(skillsService.create).toHaveBeenCalledWith(dto, userId);
    expect(result).toBe(skill);
  });

  it('passes query parameters to findAll', async () => {
    const query = {
      page: 2,
      limit: 5,
    } as GetSkillsDto;
    const response = {
      data: [],
      page: 2,
      limit: 5,
      total: 0,
      totalPages: 0,
    };
    skillsService.findAll.mockResolvedValue(response);

    const result = await controller.findAll(query);

    expect(skillsService.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(response);
  });

  it('passes skill id to findSimilar', async () => {
    const users = [{ id: 'user-2', name: 'Анна' }];
    skillsService.findSimilar.mockResolvedValue(users);

    const result = await controller.findSimilar(skillId);

    expect(skillsService.findSimilar).toHaveBeenCalledWith(skillId);
    expect(result).toBe(users);
  });

  it('protects findSimilar with AccessTokenGuard', () => {
    const handler = Object.getOwnPropertyDescriptor(
      SkillsController.prototype,
      'findSimilar',
    )?.value as object;

    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];

    expect(guards).toContain(AccessTokenGuard);
  });

  it('passes the skill UUID to findOne without numeric conversion', async () => {
    const skill = { id: skillId, title: 'Английский язык' };
    skillsService.findOne.mockResolvedValue(skill);

    const result = await controller.findOne(skillId);

    expect(skillsService.findOne).toHaveBeenCalledWith(skillId);
    expect(result).toBe(skill);
  });

  it('passes update data and current user id to the service', async () => {
    const dto = {
      title: 'Новое название',
    } as UpdateSkillDto;
    const updatedSkill = {
      id: skillId,
      title: dto.title,
    };
    skillsService.update.mockResolvedValue(updatedSkill);

    const result = await controller.update(skillId, dto, request);

    expect(skillsService.update).toHaveBeenCalledWith(skillId, dto, userId);
    expect(result).toBe(updatedSkill);
  });

  it('passes skill and user ids to addFavorite', async () => {
    const skill = { id: skillId };
    skillsService.addFavorite.mockResolvedValue(skill);

    const result = await controller.addFavorite(skillId, request);

    expect(skillsService.addFavorite).toHaveBeenCalledWith(skillId, userId);
    expect(result).toBe(skill);
  });

  it('passes skill and user ids to removeFavorite', async () => {
    skillsService.removeFavorite.mockResolvedValue(undefined);

    await controller.removeFavorite(skillId, request);

    expect(skillsService.removeFavorite).toHaveBeenCalledWith(skillId, userId);
  });

  it('passes skill and user ids to remove', async () => {
    skillsService.remove.mockResolvedValue(undefined);

    await controller.remove(skillId, request);

    expect(skillsService.remove).toHaveBeenCalledWith(skillId, userId);
  });
});

describe('GET /skills/:id', () => {
  let app: INestApplication<App>;
  const skillsRepository = { findOne: jest.fn() };
  const skillId = '6f1c1f3e-6c1a-4d3b-9a43-2d6a5c1e9b10';
  const userId = 'dc8387e8-703d-46c2-8ca6-240925334e9d';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [
        SkillsService,
        { provide: getRepositoryToken(Skill), useValue: skillsRepository },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: FilesService, useValue: {} },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    await app.init();
  });

  beforeEach(() => {
    skillsRepository.findOne.mockReset();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns skill JSON publicly without exposing owner secrets', async () => {
    const skill = Object.assign(new Skill(), {
      id: skillId,
      title: 'Английский язык',
      description: 'Обучение английскому языку.',
      images: [],
      category: {
        id: '25ac8264-c483-4bee-8f43-3169e03c101c',
        name: 'Английский',
      },
      owner: Object.assign(new User(), {
        id: userId,
        name: 'Анна',
        password: 'password-hash',
        refreshToken: 'refresh-token-hash',
      }),
    });
    skillsRepository.findOne.mockResolvedValue(skill);

    await request(app.getHttpServer())
      .get(`/skills/${skillId}`)
      .expect(200)
      .expect({
        id: skillId,
        title: skill.title,
        description: skill.description,
        images: [],
        category: skill.category,
        owner: { id: userId, name: 'Анна' },
      });
  });

  it('returns 404 when no skill matches the UUID', async () => {
    skillsRepository.findOne.mockResolvedValue(null);

    await request(app.getHttpServer()).get(`/skills/${skillId}`).expect(404);
  });

  it('rejects a non-UUID ID before querying the repository', async () => {
    await request(app.getHttpServer()).get('/skills/42').expect(400);

    expect(skillsRepository.findOne).not.toHaveBeenCalled();
  });
});
