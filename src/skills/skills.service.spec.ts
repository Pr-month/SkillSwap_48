import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { SkillsService } from './skills.service';

describe('SkillsService', () => {
  let service: SkillsService;
  const skillsRepository = { create: jest.fn(), save: jest.fn() };

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

  it('create saves the skill with the requesting user as owner', async () => {
    const dto = {
      title: 'Гитара',
      description: 'Научу играть аккорды',
      category: '6f1c1f3e-6c1a-4d3b-9a43-2d6a5c1e9b10',
    };
    const entity = { ...dto, owner: { id: 'user-1' } };
    const saved = { id: 'skill-1', ...entity };
    skillsRepository.create.mockReturnValue(entity);
    skillsRepository.save.mockResolvedValue(saved);

    const result = await service.create(dto, 'user-1');

    expect(skillsRepository.create).toHaveBeenCalledWith(entity);
    expect(skillsRepository.save).toHaveBeenCalledWith(entity);
    expect(result).toBe(saved);
  });
});
