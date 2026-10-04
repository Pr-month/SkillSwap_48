import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { SkillsService } from './skills.service';

describe('SkillsService', () => {
  let service: SkillsService;
  const skillsRepository = { create: jest.fn(), save: jest.fn(),findAndCount: jest.fn(), remove: jest.fn()  };

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

  describe('remove', () => {
    it('deletes the skill when requested by its owner', async () => {
      const skill = { id: 'skill-1', owner: { id: 'user-1' } };
      skillsRepository.findOne.mockResolvedValue(skill);

      await service.remove('skill-1', 'user-1');

      expect(skillsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'skill-1' },
        relations: { owner: true },
      });
      expect(skillsRepository.remove).toHaveBeenCalledWith(skill);
    });

    it('throws NotFoundException when the skill does not exist', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('skill-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(skillsRepository.remove).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when the skill belongs to another user', async () => {
      skillsRepository.findOne.mockResolvedValue({
        id: 'skill-1',
        owner: { id: 'user-2' },
      });

      await expect(service.remove('skill-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(skillsRepository.remove).not.toHaveBeenCalled();
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
  })
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
