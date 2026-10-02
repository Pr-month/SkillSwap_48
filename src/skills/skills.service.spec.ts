import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { SkillsService } from './skills.service';

describe('SkillsService', () => {
  let service: SkillsService;
  const skillsRepository = { findAndCount: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: getRepositoryToken(Skill), useValue: skillsRepository },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll paginates skills via skip/take', async () => {
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
});
