import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { Skill } from '../skills/entities/skill.entity';
import { Request } from './entities/request.entity';
import { RequestStatus } from './requests.enums';
import { RequestsService } from './requests.service';

describe('RequestsService', () => {
  let service: RequestsService;
  const requestsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };
  const skillsRepository = { findOne: jest.fn() };

  const dto = { offeredSkillId: 'offered-1', requestedSkillId: 'requested-1' };
  const offeredSkill = { id: 'offered-1', owner: { id: 'sender-1' } };
  const requestedSkill = { id: 'requested-1', owner: { id: 'receiver-1' } };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: getRepositoryToken(Request), useValue: requestsRepository },
        { provide: getRepositoryToken(Skill), useValue: skillsRepository },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  it('creates a request from the sender to the requested skill owner', async () => {
    skillsRepository.findOne
      .mockResolvedValueOnce(offeredSkill)
      .mockResolvedValueOnce(requestedSkill);
    const entity = {
      sender: { id: 'sender-1' },
      receiver: { id: 'receiver-1' },
      offeredSkill: { id: 'offered-1' },
      requestedSkill: { id: 'requested-1' },
    };
    const saved = { id: 'request-1', ...entity };
    requestsRepository.create.mockReturnValue(entity);
    requestsRepository.save.mockResolvedValue(saved);

    const result = await service.create(dto, 'sender-1');

    expect(skillsRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'offered-1' },
      relations: { owner: true },
    });
    expect(requestsRepository.create).toHaveBeenCalledWith(entity);
    expect(requestsRepository.save).toHaveBeenCalledWith(entity);
    expect(result).toBe(saved);
  });

  it('throws NotFoundException when a skill does not exist', async () => {
    skillsRepository.findOne.mockResolvedValueOnce(null);

    await expect(service.create(dto, 'sender-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(requestsRepository.save).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when offering someone else’s skill', async () => {
    skillsRepository.findOne.mockResolvedValueOnce(offeredSkill);

    await expect(service.create(dto, 'another-user')).rejects.toThrow(
      ForbiddenException,
    );
    expect(requestsRepository.save).not.toHaveBeenCalled();
  });

  it('findIncoming returns active requests addressed to the user', async () => {
    const requests = [{ id: 'request-1' }];
    requestsRepository.find.mockResolvedValue(requests);

    const result = await service.findIncoming('receiver-1');

    expect(requestsRepository.find).toHaveBeenCalledWith({
      where: {
        receiver: { id: 'receiver-1' },
        status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
      },
      relations: { sender: true, offeredSkill: true, requestedSkill: true },
      order: { createdAt: 'DESC' },
    });
    expect(result).toBe(requests);
  });

  it('throws BadRequestException when requesting own skill', async () => {
    skillsRepository.findOne
      .mockResolvedValueOnce(offeredSkill)
      .mockResolvedValueOnce({ id: 'requested-1', owner: { id: 'sender-1' } });

    await expect(service.create(dto, 'sender-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(requestsRepository.save).not.toHaveBeenCalled();
  });
});
