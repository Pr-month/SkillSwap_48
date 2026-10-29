import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FilesService } from '../files/files.service';
import { User } from '../users/entities/user.entity';
import { Skill } from './entities/skill.entity';
import { SkillsService } from './skills.service';

describe('SkillsService', () => {
  let service: SkillsService;

  const queryBuilder = {
    innerJoin: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    select: jest.fn(),
    distinct: jest.fn(),
    take: jest.fn(),
    getMany: jest.fn(),
  };

  const skillsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const usersRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const filesService = {
    removeFiles: jest.fn(),
  };

  const userId = 'dc8387e8-703d-46c2-8ca6-240925334e9d';
  const anotherUserId = '91ed531a-29dc-4d68-84c6-6712b866b8f6';
  const skillId = '6f1c1f3e-6c1a-4d3b-9a43-2d6a5c1e9b10';
  const categoryId = '25ac8264-c483-4bee-8f43-3169e03c101c';

  beforeEach(async () => {
    jest.resetAllMocks();

    queryBuilder.innerJoin.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.distinct.mockReturnValue(queryBuilder);
    queryBuilder.take.mockReturnValue(queryBuilder);
    usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        {
          provide: getRepositoryToken(Skill),
          useValue: skillsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: FilesService,
          useValue: filesService,
        },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('saves the skill with the requesting user as owner', async () => {
      const dto = {
        title: 'Гитара',
        description: 'Научу играть аккорды',
        category: categoryId,
      };
      const entity = {
        title: dto.title,
        description: dto.description,
        category: { id: categoryId },
        owner: { id: userId },
      };
      const saved = {
        id: skillId,
        ...entity,
      };

      skillsRepository.create.mockReturnValue(entity);
      skillsRepository.save.mockResolvedValue(saved);

      const result = await service.create(dto, userId);

      expect(skillsRepository.create).toHaveBeenCalledWith(entity);
      expect(skillsRepository.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(saved);
    });
  });

  describe('findAll', () => {
    it('paginates skills using the supplied page and limit', async () => {
      const skills = [{ id: 'a' }, { id: 'b' }];
      skillsRepository.findAndCount.mockResolvedValue([skills, 25]);

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(skillsRepository.findAndCount).toHaveBeenCalledWith({
        order: { id: 'ASC' },
        skip: 20,
        take: 10,
      });
      expect(result).toEqual({
        data: skills,
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('uses the default page and limit', async () => {
      skillsRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(skillsRepository.findAndCount).toHaveBeenCalledWith({
        order: { id: 'ASC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        data: [],
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    });
  });

  describe('findSimilar', () => {
    it('returns up to 10 unique users from the same category without the owner', async () => {
      const users = [
        {
          id: anotherUserId,
          name: 'Анна',
        },
      ];

      skillsRepository.findOne.mockResolvedValue({
        id: skillId,
        category: { id: categoryId },
        owner: { id: userId },
      });
      queryBuilder.getMany.mockResolvedValue(users);

      const result = await service.findSimilar(skillId);

      expect(skillsRepository.findOne).toHaveBeenCalledWith({
        where: { id: skillId },
        relations: {
          category: true,
          owner: true,
        },
      });
      expect(usersRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.innerJoin).toHaveBeenNthCalledWith(
        1,
        'user.skills',
        'skill',
      );
      expect(queryBuilder.innerJoin).toHaveBeenNthCalledWith(
        2,
        'skill.category',
        'category',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'category.id = :categoryId',
        {
          categoryId,
        },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'user.id != :ownerId',
        {
          ownerId: userId,
        },
      );
      expect(queryBuilder.select).toHaveBeenCalledWith([
        'user.id',
        'user.name',
        'user.email',
        'user.about',
        'user.birthdate',
        'user.city',
        'user.gender',
        'user.avatar',
        'user.role',
      ]);
      expect(queryBuilder.distinct).toHaveBeenCalledWith(true);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(queryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(users);
    });

    it('returns an empty array when similar users do not exist', async () => {
      skillsRepository.findOne.mockResolvedValue({
        id: skillId,
        category: { id: categoryId },
        owner: { id: userId },
      });
      queryBuilder.getMany.mockResolvedValue([]);

      await expect(service.findSimilar(skillId)).resolves.toEqual([]);
    });

    it('throws NotFoundException when the source skill does not exist', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(service.findSimilar(skillId)).rejects.toThrow(
        NotFoundException,
      );
      expect(usersRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns a stored skill with its category and public owner fields', async () => {
      const skill = {
        id: skillId,
        title: 'Английский язык',
        description: 'Обучение английскому языку.',
        images: [],
        category: { id: categoryId, name: 'Английский' },
        owner: { id: userId, name: 'Анна' },
      };
      skillsRepository.findOne.mockResolvedValue(skill);

      await expect(service.findOne(skillId)).resolves.toBe(skill);
      expect(skillsRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: skillId },
          relations: { category: true, owner: true },
        }),
      );
      const [options] = skillsRepository.findOne.mock.calls[0] as [
        {
          select: { owner: Record<string, boolean> };
        },
      ];
      expect(options.select.owner).toMatchObject({ id: true, name: true });
      expect(options.select.owner).not.toHaveProperty('password');
      expect(options.select.owner).not.toHaveProperty('refreshToken');
    });

    it('throws NotFoundException when the requested skill does not exist', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(skillId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates a skill owned by the requesting user', async () => {
      const skill = {
        id: skillId,
        title: 'Старое название',
        description: 'Описание',
        category: { id: categoryId },
        owner: { id: userId },
      };
      const dto = {
        title: 'Новое название',
      };

      skillsRepository.findOne.mockResolvedValue(skill);
      skillsRepository.save.mockImplementation((value) =>
        Promise.resolve(value),
      );

      const result = await service.update(skillId, dto, userId);

      expect(skillsRepository.findOne).toHaveBeenCalledWith({
        where: { id: skillId },
        relations: { owner: true },
      });
      expect(skillsRepository.save).toHaveBeenCalledWith(skill);
      expect(result.title).toBe(dto.title);
      expect(result.category).toEqual({ id: categoryId });
    });

    it('updates the skill category', async () => {
      const newCategoryId = '2035069b-ee27-48cb-8392-494a1fd9fe30';
      const skill = {
        id: skillId,
        title: 'Гитара',
        description: 'Описание',
        category: { id: categoryId },
        owner: { id: userId },
      };
      const dto = {
        description: 'Новое описание',
        category: newCategoryId,
      };

      skillsRepository.findOne.mockResolvedValue(skill);
      skillsRepository.save.mockImplementation((value) =>
        Promise.resolve(value),
      );

      const result = await service.update(skillId, dto, userId);

      expect(result.description).toBe(dto.description);
      expect(result.category).toEqual({ id: newCategoryId });
      expect(skillsRepository.save).toHaveBeenCalledWith(skill);
    });

    it('throws NotFoundException when the skill does not exist', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(skillId, { title: 'Название' }, userId),
      ).rejects.toThrow(NotFoundException);
      expect(skillsRepository.save).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when another user owns the skill', async () => {
      skillsRepository.findOne.mockResolvedValue({
        id: skillId,
        owner: { id: anotherUserId },
      });

      await expect(
        service.update(skillId, { title: 'Название' }, userId),
      ).rejects.toThrow(ForbiddenException);
      expect(skillsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the skill and its images when requested by its owner', async () => {
      const skill = {
        id: skillId,
        owner: { id: userId },
        images: ['/public/uploads/a.png', '/public/uploads/b.png'],
      };
      skillsRepository.findOne.mockResolvedValue(skill);

      await service.remove(skillId, userId);

      expect(skillsRepository.findOne).toHaveBeenCalledWith({
        where: { id: skillId },
        relations: { owner: true },
      });
      expect(skillsRepository.remove).toHaveBeenCalledWith(skill);
      expect(filesService.removeFiles).toHaveBeenCalledWith(skill.images);
    });

    it('uses an empty image array when the skill has no images', async () => {
      skillsRepository.findOne.mockResolvedValue({
        id: skillId,
        owner: { id: userId },
        images: undefined,
      });

      await service.remove(skillId, userId);

      expect(filesService.removeFiles).toHaveBeenCalledWith([]);
    });

    it('throws NotFoundException when the skill does not exist', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(skillId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(skillsRepository.remove).not.toHaveBeenCalled();
      expect(filesService.removeFiles).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when another user owns the skill', async () => {
      skillsRepository.findOne.mockResolvedValue({
        id: skillId,
        owner: { id: anotherUserId },
        images: ['/public/uploads/a.png'],
      });

      await expect(service.remove(skillId, userId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(skillsRepository.remove).not.toHaveBeenCalled();
      expect(filesService.removeFiles).not.toHaveBeenCalled();
    });
  });

  describe('addFavorite', () => {
    it('adds the skill to the user favorites', async () => {
      const skill = {
        id: skillId,
      };
      const user = {
        id: userId,
        favoriteSkills: [],
      };

      skillsRepository.findOne.mockResolvedValue(skill);
      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.save.mockResolvedValue(user);

      const result = await service.addFavorite(skillId, userId);

      expect(skillsRepository.findOne).toHaveBeenCalledWith({
        where: { id: skillId },
      });
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: { favoriteSkills: true },
      });
      expect(user.favoriteSkills).toEqual([skill]);
      expect(usersRepository.save).toHaveBeenCalledWith(user);
      expect(result).toBe(skill);
    });

    it('throws NotFoundException when the skill does not exist', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(service.addFavorite(skillId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(usersRepository.findOne).not.toHaveBeenCalled();
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the user does not exist', async () => {
      skillsRepository.findOne.mockResolvedValue({ id: skillId });
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.addFavorite(skillId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the skill is already in favorites', async () => {
      const skill = {
        id: skillId,
      };
      skillsRepository.findOne.mockResolvedValue(skill);
      usersRepository.findOne.mockResolvedValue({
        id: userId,
        favoriteSkills: [skill],
      });

      await expect(service.addFavorite(skillId, userId)).rejects.toThrow(
        ConflictException,
      );
      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('removeFavorite', () => {
    it('removes the skill from the user favorites', async () => {
      const remainingSkill = {
        id: '23b863cf-ee76-4846-8943-fbf2f91228ce',
      };
      const user = {
        id: userId,
        favoriteSkills: [{ id: skillId }, remainingSkill],
      };

      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.save.mockResolvedValue(user);

      await service.removeFavorite(skillId, userId);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: { favoriteSkills: true },
      });
      expect(user.favoriteSkills).toEqual([remainingSkill]);
      expect(usersRepository.save).toHaveBeenCalledWith(user);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.removeFavorite(skillId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the skill is not in favorites', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: userId,
        favoriteSkills: [],
      });

      await expect(service.removeFavorite(skillId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });
});
