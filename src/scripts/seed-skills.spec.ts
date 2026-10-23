import { DataSource, EntityManager, IsNull } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';
import { testSkills } from './data/seed-skills.data';
import { seedSkills, SkillsSeedResult } from './seed-skills';

jest.mock('../config/ormconfig', () => ({ AppDataSource: {} }));

describe('Skills seeding', () => {
  const usersRepository = { findOneBy: jest.fn() };
  const categoriesRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const skillsRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === User) return usersRepository;
      if (entity === Category) return categoriesRepository;
      if (entity === Skill) return skillsRepository;
      throw new Error('Unexpected entity');
    }),
  } as unknown as EntityManager;
  const dataSource = {
    transaction: (
      callback: (manager: EntityManager) => Promise<SkillsSeedResult>,
    ) => callback(manager),
  } as DataSource;

  beforeEach(() => {
    jest.clearAllMocks();
    usersRepository.findOneBy.mockImplementation(
      ({ email }: { email: string }) =>
        Promise.resolve({ id: `owner-${email}`, email }),
    );
    categoriesRepository.findOneBy.mockImplementation(
      ({ name }: { name: string }) =>
        Promise.resolve({ id: `category-${name}`, name }),
    );
    categoriesRepository.create.mockImplementation((data: unknown) => data);
    categoriesRepository.save.mockImplementation((data: { name: string }) =>
      Promise.resolve({ id: `new-${data.name}`, ...data }),
    );
    skillsRepository.findOneBy.mockResolvedValue(null);
    skillsRepository.create.mockImplementation((data: unknown) => data);
    skillsRepository.save.mockResolvedValue({});
  });

  it('assigns the design skills to the matching seeded users and subcategories', async () => {
    const result = await seedSkills(dataSource);

    expect(result).toEqual({ created: testSkills.length, skipped: 0 });
    for (const skill of testSkills) {
      expect(skillsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: skill.title,
          owner: {
            id: `owner-${skill.ownerEmail}`,
            email: skill.ownerEmail,
          },
          category: {
            id: `category-${skill.subcategoryName}`,
            name: skill.subcategoryName,
          },
        }),
      );
    }
    expect(categoriesRepository.save).not.toHaveBeenCalled();
  });

  it('looks up subcategories under their specific parent from the design', async () => {
    await seedSkills(dataSource);

    for (const skill of testSkills) {
      expect(categoriesRepository.findOneBy).toHaveBeenCalledWith({
        name: skill.categoryName,
        parent: IsNull(),
      });
      expect(categoriesRepository.findOneBy).toHaveBeenCalledWith({
        name: skill.subcategoryName,
        parent: { id: `category-${skill.categoryName}` },
      });
    }
  });

  it('creates missing category trees without attaching skills to the roots', async () => {
    categoriesRepository.findOneBy.mockResolvedValue(null);

    await seedSkills(dataSource);

    for (const skill of testSkills) {
      expect(categoriesRepository.create).toHaveBeenCalledWith({
        name: skill.categoryName,
        parent: null,
      });
      expect(categoriesRepository.create).toHaveBeenCalledWith({
        name: skill.subcategoryName,
        parent: {
          id: `new-${skill.categoryName}`,
          name: skill.categoryName,
          parent: null,
        },
      });
    }
    expect(categoriesRepository.save).toHaveBeenCalledTimes(4);
  });

  it('leaves existing skills unchanged on repeated runs', async () => {
    skillsRepository.findOneBy.mockResolvedValue({ id: 'existing-skill' });

    const result = await seedSkills(dataSource);

    expect(result).toEqual({ created: 0, skipped: testSkills.length });
    expect(skillsRepository.save).not.toHaveBeenCalled();
    expect(categoriesRepository.save).not.toHaveBeenCalled();
  });

  it('stops if the seeded owner is missing instead of creating orphan skills', async () => {
    usersRepository.findOneBy.mockResolvedValue(null);

    await expect(seedSkills(dataSource)).rejects.toThrow(
      'Не найден сидинговый пользователь',
    );
    expect(skillsRepository.save).not.toHaveBeenCalled();
    expect(categoriesRepository.save).not.toHaveBeenCalled();
  });

  it('propagates database failures to the caller', async () => {
    skillsRepository.save.mockRejectedValueOnce(new Error('database failure'));

    await expect(seedSkills(dataSource)).rejects.toThrow('database failure');
  });
});
