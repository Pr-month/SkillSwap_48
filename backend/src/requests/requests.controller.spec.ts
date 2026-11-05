import { Test, TestingModule } from '@nestjs/testing';
import type { AuthRequest } from '../auth/auth.types';
import { UserRole } from '../users/users.enums';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

describe('RequestsController', () => {
  let controller: RequestsController;
  const requestsService = {
    create: jest.fn(),
    findIncoming: jest.fn(),
    findOutgoing: jest.fn(),
  };

  const dto = { offeredSkillId: 'offered-1', requestedSkillId: 'requested-1' };
  const req = {
    user: { sub: 'user-1', email: 'user@example.com', role: UserRole.USER },
  } as AuthRequest;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [{ provide: RequestsService, useValue: requestsService }],
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create forwards the dto and the current user id', async () => {
    const created = { id: 'request-1' };
    requestsService.create.mockResolvedValue(created);

    await expect(controller.create(dto, req)).resolves.toBe(created);
    expect(requestsService.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('findIncoming asks for the current user incoming requests', async () => {
    const incoming = [{ id: 'request-1' }];
    requestsService.findIncoming.mockResolvedValue(incoming);

    await expect(controller.findIncoming(req)).resolves.toBe(incoming);
    expect(requestsService.findIncoming).toHaveBeenCalledWith('user-1');
  });

  it('findOutgoing asks for the current user outgoing requests', async () => {
    const outgoing = [{ id: 'request-2' }];
    requestsService.findOutgoing.mockResolvedValue(outgoing);

    await expect(controller.findOutgoing(req)).resolves.toBe(outgoing);
    expect(requestsService.findOutgoing).toHaveBeenCalledWith('user-1');
  });
});
